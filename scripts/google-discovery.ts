// Converts Google's own Discovery documents into the OpenAPI documents the Google packages vendor.
// Google publishes its REST APIs as Discovery documents, not OpenAPI, so this is the first-party
// source; no third-party conversion is involved. Each output records its Discovery URL and revision
// in info.x-executor-discovery.
// Usage: node scripts/google-discovery.ts [api...]   (default: every API below), then run
// node scripts/google-vendor.ts so packages/google picks up the new copies.
//
// Conversion rules:
// - Every method is one operation, `operationId` = the method id and its first tag = the top-level
//   resource, as in the APIs.guru conversions these documents replaced, so tool names stay stable.
// - The JSON resource (`request`) is the body on the method's own path. Media upload is a separate
//   protocol on /upload/... that the conversion does not offer beside it: a raw media body is base64
//   in a tool call, and metadata plus a file (multipart/related) cannot be expressed. So every
//   method that takes both must be listed per API, either in `jsonComplete` (the JSON body alone
//   does the job, e.g. Gmail's `raw`) or in `exclude` (it needs the file); the script fails on an
//   unlisted one. A method whose only body is media (YouTube thumbnails.set) is sent with the
//   simple upload protocol (`uploadType=media`) on its /upload/ path, with the media types it accepts.
// - Methods every one of whose scopes starts with an `excludeScopes` prefix are left out, with its
//   reason; the script fails if a prefix matches nothing.
// - `{+name}` path templates keep the whole resource name as one parameter (`allowReserved`).
// - Of Google's standard parameters `fields` (partial responses) and `quotaUser` (per-user quota
//   attribution) are offered. The rest carry credentials (`key`, `access_token`, `oauth_token`),
//   which account bindings supply, select transports (`alt`, `uploadType`, `upload_protocol`,
//   `callback`) or change error and output formatting (`$.xgafv`, `prettyPrint`).
// - Output is sorted (resources, methods, parameters, schemas, properties, paths, tags), so
//   regenerating an unchanged Discovery revision changes nothing. Left-out methods and their
//   reasons are recorded in info.x-executor-discovery.excluded.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * API → its Discovery document, the vendored OpenAPI file written from it, methods left out
 * (method id → why), methods left out by scope (scope prefix → why), and methods that accept media
 * beside a JSON body whose JSON body alone is complete (method id → why).
 */
interface Api {
  readonly discovery: string;
  readonly out: string;
  readonly exclude?: Readonly<Record<string, string>>;
  readonly excludeScopes?: Readonly<Record<string, string>>;
  readonly jsonComplete?: Readonly<Record<string, string>>;
}

const gmailRaw = "`raw` carries the whole RFC 822 message in the JSON body";
const needsFile = (what: string) =>
  `needs the ${what} file, sent as media upload; a JSON-only call has nothing to upload`;

const apis: Record<string, Api> = {
  gmail: {
    discovery: "https://gmail.googleapis.com/$discovery/rest?version=v1",
    out: "packages/gmail/openapi.json",
    jsonComplete: {
      "gmail.users.drafts.create": gmailRaw,
      "gmail.users.drafts.send": `${gmailRaw}, or \`id\` names an existing draft`,
      "gmail.users.drafts.update": gmailRaw,
      "gmail.users.messages.import": gmailRaw,
      "gmail.users.messages.insert": gmailRaw,
      "gmail.users.messages.send": gmailRaw,
    },
  },
  sheets: { discovery: "https://sheets.googleapis.com/$discovery/rest?version=v4", out: "packages/google-sheets/openapi.json" },
  forms: { discovery: "https://forms.googleapis.com/$discovery/rest?version=v1", out: "packages/google-forms/openapi.json" },
  tasks: { discovery: "https://tasks.googleapis.com/$discovery/rest?version=v1", out: "packages/google-tasks/openapi.json" },
  classroom: {
    discovery: "https://classroom.googleapis.com/$discovery/rest?version=v1",
    out: "packages/google-classroom/openapi.json",
    excludeScopes: {
      "https://www.googleapis.com/auth/classroom.addons.":
        "accepts only the classroom.addons.* scopes, which belong to Classroom add-on apps and need their own Google verification; this app does not request them",
    },
  },
  youtube: {
    discovery: "https://youtube.googleapis.com/$discovery/rest?version=v3",
    out: "packages/youtube/openapi.json",
    exclude: {
      "youtube.youtube.v3.liveChat.messages.stream":
        "a server-streamed RPC that keeps its response open while the chat runs; liveChatMessages.list polls the same messages",
      "youtube.videos.insert": needsFile("video"),
      "youtube.captions.insert": needsFile("caption track"),
      "youtube.playlistImages.insert": needsFile("image"),
      "youtube.channelBanners.insert": `${needsFile("banner image")}; the JSON resource holds only the resulting URL`,
      "youtube.watermarks.set": `${needsFile("watermark image")}; \`imageBytes\` is internal to Google`,
    },
    jsonComplete: {
      "youtube.captions.update": "Google accepts an update without a file, for example to change only the draft status",
      "youtube.playlistImages.update": "Google documents it as a metadata update (snippet type, width and height)",
    },
  },
};

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };

interface Schema {
  readonly $ref?: string;
  readonly type?: string;
  readonly format?: string;
  readonly description?: string;
  readonly enum?: readonly string[];
  readonly properties?: Readonly<Record<string, Schema>>;
  readonly additionalProperties?: Schema;
  readonly items?: Schema;
  readonly readOnly?: boolean;
  readonly deprecated?: boolean;
}
interface Parameter extends Schema {
  readonly location: "path" | "query";
  readonly required?: boolean;
  readonly repeated?: boolean;
  readonly pattern?: string;
  readonly minimum?: string;
  readonly maximum?: string;
}
interface Method {
  readonly id: string;
  readonly path: string;
  readonly httpMethod: string;
  readonly description?: string;
  readonly deprecated?: boolean;
  readonly scopes?: readonly string[];
  readonly parameters?: Readonly<Record<string, Parameter>>;
  readonly request?: { readonly $ref: string };
  readonly response?: { readonly $ref: string };
  readonly mediaUpload?: {
    readonly accept: readonly string[];
    readonly protocols: { readonly simple?: { readonly path: string } };
  };
}
interface Resource {
  readonly methods?: Readonly<Record<string, Method>>;
  readonly resources?: Readonly<Record<string, Resource>>;
}
interface Discovery extends Resource {
  readonly name: string;
  readonly version: string;
  readonly revision: string;
  readonly title: string;
  readonly description?: string;
  readonly documentationLink?: string;
  readonly rootUrl: string;
  readonly servicePath: string;
  readonly parameters: Readonly<Record<string, Parameter>>;
  readonly schemas?: Readonly<Record<string, Schema>>;
}

/** Entries sorted by key, so output does not depend on the Discovery document's key order. */
const sorted = <T>(record: Readonly<Record<string, T>> | undefined): [string, T][] =>
  Object.entries(record ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

const schema = (s: Schema): Record<string, Json> => {
  const out: Record<string, Json> = {};
  if (s.$ref !== undefined) out.$ref = `#/components/schemas/${s.$ref}`;
  if (s.description !== undefined) out.description = s.description;
  if (s.$ref !== undefined) return out;
  // "any" is Discovery's unconstrained value.
  if (s.type !== undefined && s.type !== "any") out.type = s.type;
  if (s.format !== undefined) out.format = s.format;
  if (s.enum !== undefined) out.enum = s.enum;
  if (s.properties !== undefined)
    out.properties = Object.fromEntries(sorted(s.properties).map(([name, value]) => [name, schema(value)]));
  if (s.additionalProperties !== undefined) out.additionalProperties = schema(s.additionalProperties);
  if (s.items !== undefined) out.items = schema(s.items);
  if (s.readOnly === true) out.readOnly = true;
  if (s.deprecated === true) out.deprecated = true;
  return out;
};

const parameter = (name: string, p: Parameter, reserved: boolean): Record<string, Json> => {
  const value = schema({ type: p.type, format: p.format, enum: p.enum });
  if (p.pattern !== undefined) value.pattern = p.pattern;
  if (p.minimum !== undefined) value.minimum = Number(p.minimum);
  if (p.maximum !== undefined) value.maximum = Number(p.maximum);
  return {
    name,
    in: p.location,
    required: p.location === "path" || p.required === true,
    ...(p.description === undefined ? {} : { description: p.description }),
    ...(p.deprecated === true ? { deprecated: true } : {}),
    // Repeated query parameters are sent as `name=a&name=b`.
    ...(p.repeated === true ? { style: "form", explode: true } : {}),
    ...(reserved ? { allowReserved: true } : {}),
    schema: p.repeated === true ? { type: "array", items: value } : value,
  };
};

const convert = (d: Discovery, source: string, api: Api): Record<string, Json> => {
  const standard = ["fields", "quotaUser"].map((name) => {
    const p = d.parameters[name];
    if (p === undefined) throw new Error(`${source} declares no ${name} parameter`);
    return [name, p] as const;
  });
  const exclude = api.exclude ?? {};
  const excludeScopes = api.excludeScopes ?? {};
  const jsonComplete = api.jsonComplete ?? {};
  const paths: Record<string, Record<string, Json>> = {};
  const tags = new Set<string>();
  // Method id → why it was left out, as written into the document.
  const excluded: Record<string, string> = {};
  const matched = new Set<string>();
  const add = (method: Method, tag: string | undefined) => {
    const scopes = method.scopes ?? [];
    const prefix = Object.keys(excludeScopes).find(
      (candidate) => scopes.length > 0 && scopes.every((scope) => scope.startsWith(candidate)),
    );
    const reason = exclude[method.id] ?? (prefix === undefined ? undefined : excludeScopes[prefix]);
    if (reason !== undefined) {
      if (exclude[method.id] === undefined && prefix !== undefined) matched.add(prefix);
      excluded[method.id] = reason;
      return;
    }
    if (method.request !== undefined && method.mediaUpload !== undefined && jsonComplete[method.id] === undefined)
      throw new Error(
        `${method.id} accepts media beside its JSON body: list it in jsonComplete if the JSON body alone does the job, else in exclude`,
      );
    const upload = method.mediaUpload?.protocols.simple?.path;
    const mediaOnly = method.request === undefined && method.mediaUpload !== undefined;
    if (mediaOnly && upload === undefined) throw new Error(`${method.id} accepts only media but has no simple upload path`);
    // `{+name}` is a resource name that keeps its slashes.
    const reserved = new Set([...method.path.matchAll(/\{\+([^}]+)\}/g)].map((match) => match[1]));
    const template = mediaOnly && upload !== undefined ? upload.replace(/^\//, "") : `${d.servicePath}${method.path}`;
    const path = `/${template.replace(/\{\+([^}]+)\}/g, "{$1}")}`;
    const own = sorted(method.parameters);
    for (const [name] of standard)
      if (own.some(([other]) => other === name)) throw new Error(`${method.id} declares its own ${name} parameter`);
    const parameters: { readonly name: string; readonly value: Record<string, Json> }[] = [...own, ...standard].map(
      ([name, p]) => ({ name, value: parameter(name, p, reserved.has(name)) }),
    );
    // The simple upload protocol: the request body is the media itself.
    if (mediaOnly)
      parameters.push({
        name: "uploadType",
        value: {
          name: "uploadType",
          in: "query",
          required: true,
          description: 'Always "media": the request body is the file itself.',
          schema: { type: "string", enum: ["media"] },
        },
      });
    parameters.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const media = (method.mediaUpload?.accept ?? []).filter((type) => !type.includes("*"));
    const operation: Record<string, Json> = {
      operationId: method.id,
      ...(tag === undefined ? {} : { tags: [tag] }),
      ...(method.description === undefined ? {} : { description: method.description.trim() }),
      ...(method.deprecated === true ? { deprecated: true } : {}),
      parameters: parameters.map(({ value }) => value),
      ...(method.request !== undefined
        ? {
            requestBody: {
              required: true,
              content: { "application/json": { schema: schema(method.request) } },
            },
          }
        : mediaOnly
          ? {
              requestBody: {
                required: true,
                content: Object.fromEntries(
                  (media.length > 0 ? media : ["application/octet-stream"]).map((type) => [
                    type,
                    { schema: { type: "string", format: "binary" } },
                  ]),
                ),
              },
            }
          : {}),
      responses: {
        200:
          method.response === undefined
            ? { description: "Successful response" }
            : {
                description: "Successful response",
                content: { "application/json": { schema: schema(method.response) } },
              },
      },
      security: [{ bearer: [] }],
    };
    const item = (paths[path] ??= {});
    const verb = method.httpMethod.toLowerCase();
    if (item[verb] !== undefined) throw new Error(`${method.id} and another method share ${verb.toUpperCase()} ${path}`);
    item[verb] = operation;
    if (tag !== undefined) tags.add(tag);
  };
  const walk = (resource: Resource, tag: string | undefined) => {
    for (const [, method] of sorted(resource.methods)) add(method, tag);
    for (const [name, child] of sorted(resource.resources)) walk(child, tag ?? name);
  };
  walk(d, undefined);
  const stale = [
    ...Object.keys(exclude).filter((id) => excluded[id] === undefined),
    ...Object.keys(excludeScopes).filter((prefix) => !matched.has(prefix)),
  ];
  if (stale.length > 0) throw new Error(`${source} no longer has the excluded ${stale.join(", ")}`);
  const known = new Set<string>();
  const collect = (resource: Resource) => {
    for (const [, method] of sorted(resource.methods)) known.add(method.id);
    for (const [, child] of sorted(resource.resources)) collect(child);
  };
  collect(d);
  const missing = Object.keys(jsonComplete).filter((id) => !known.has(id) || excluded[id] !== undefined);
  if (missing.length > 0) throw new Error(`${source} lists ${missing.join(", ")} in jsonComplete but does not offer them`);
  return {
    openapi: "3.0.3",
    info: {
      title: d.title,
      version: d.version,
      ...(d.description === undefined ? {} : { description: d.description }),
      "x-executor-discovery": { url: source, revision: d.revision, excluded: Object.fromEntries(sorted(excluded)) },
    },
    ...(d.documentationLink === undefined ? {} : { externalDocs: { url: d.documentationLink } }),
    servers: [{ url: d.rootUrl.replace(/\/$/, "") }],
    security: [{ bearer: [] }],
    tags: [...tags].sort().map((name) => ({ name })),
    paths: Object.fromEntries(sorted(paths).map(([path, item]) => [path, Object.fromEntries(sorted(item))])),
    components: {
      schemas: Object.fromEntries(sorted(d.schemas).map(([name, value]) => [name, schema(value)])),
      securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
    },
  };
};

const root = new URL("..", import.meta.url).pathname;
const wanted = process.argv.slice(2);
for (const name of wanted) if (apis[name] === undefined) throw new Error(`Unknown API ${name}; known: ${Object.keys(apis).join(", ")}`);
for (const [name, api] of Object.entries(apis)) {
  if (wanted.length > 0 && !wanted.includes(name)) continue;
  const response = await fetch(api.discovery);
  if (!response.ok) throw new Error(`${api.discovery} answered HTTP ${response.status}`);
  const d = (await response.json()) as Discovery;
  const document = convert(d, api.discovery, api);
  writeFileSync(join(root, api.out), `${JSON.stringify(document, null, 1)}\n`);
  const left = Object.keys((document.info as { "x-executor-discovery": { excluded: object } })["x-executor-discovery"].excluded).length;
  console.log(`${name}: wrote ${api.out} (revision ${d.revision}, ${left} methods left out)`);
}
