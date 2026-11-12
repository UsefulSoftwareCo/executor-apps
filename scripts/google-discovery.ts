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
//   in a tool call, which gains nothing over the resource's own fields (Gmail's `raw`). A method
//   whose only body is media (YouTube thumbnails.set) is sent with the simple upload protocol
//   (`uploadType=media`) on its /upload/ path, with the media types it accepts.
// - `{+name}` path templates keep the whole resource name as one parameter (`allowReserved`).
// - Of Google's standard parameters only `fields` is offered. The rest carry credentials (`key`,
//   `access_token`, `oauth_token`), select transports (`alt`, `uploadType`, `upload_protocol`,
//   `callback`) or change error and output formatting (`$.xgafv`, `prettyPrint`).
import { writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * API → its Discovery document, the vendored OpenAPI file written from it, and any methods left
 * out (method id → why).
 */
const apis: Record<
  string,
  { readonly discovery: string; readonly out: string; readonly exclude?: Readonly<Record<string, string>> }
> = {
  gmail: { discovery: "https://gmail.googleapis.com/$discovery/rest?version=v1", out: "packages/gmail/openapi.json" },
  sheets: { discovery: "https://sheets.googleapis.com/$discovery/rest?version=v4", out: "packages/google-sheets/openapi.json" },
  forms: { discovery: "https://forms.googleapis.com/$discovery/rest?version=v1", out: "packages/google-forms/openapi.json" },
  tasks: { discovery: "https://tasks.googleapis.com/$discovery/rest?version=v1", out: "packages/google-tasks/openapi.json" },
  classroom: {
    discovery: "https://classroom.googleapis.com/$discovery/rest?version=v1",
    out: "packages/google-classroom/openapi.json",
  },
  youtube: {
    discovery: "https://youtube.googleapis.com/$discovery/rest?version=v3",
    out: "packages/youtube/openapi.json",
    exclude: {
      "youtube.youtube.v3.liveChat.messages.stream":
        "a server-streamed RPC that keeps its response open while the chat runs; liveChatMessages.list polls the same messages",
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
    out.properties = Object.fromEntries(Object.entries(s.properties).map(([name, value]) => [name, schema(value)]));
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

const convert = (d: Discovery, source: string, exclude: ReadonlySet<string>): Record<string, Json> => {
  const fields = d.parameters.fields;
  if (fields === undefined) throw new Error(`${source} declares no fields parameter`);
  const paths: Record<string, Record<string, Json>> = {};
  const tags: string[] = [];
  const excluded = new Set<string>();
  const add = (method: Method, tag: string | undefined) => {
    if (exclude.has(method.id)) {
      excluded.add(method.id);
      return;
    }
    const upload = method.mediaUpload?.protocols.simple?.path;
    const mediaOnly = method.request === undefined && method.mediaUpload !== undefined;
    if (mediaOnly && upload === undefined) throw new Error(`${method.id} accepts only media but has no simple upload path`);
    // `{+name}` is a resource name that keeps its slashes.
    const reserved = new Set([...method.path.matchAll(/\{\+([^}]+)\}/g)].map((match) => match[1]));
    const template = mediaOnly && upload !== undefined ? upload.replace(/^\//, "") : `${d.servicePath}${method.path}`;
    const path = `/${template.replace(/\{\+([^}]+)\}/g, "{$1}")}`;
    const parameters = Object.entries(method.parameters ?? {}).map(([name, p]) => parameter(name, p, reserved.has(name)));
    parameters.push(parameter("fields", fields, false));
    // The simple upload protocol: the request body is the media itself.
    if (mediaOnly)
      parameters.push({
        name: "uploadType",
        in: "query",
        required: true,
        description: 'Always "media": the request body is the file itself.',
        schema: { type: "string", enum: ["media"] },
      });
    const media = (method.mediaUpload?.accept ?? []).filter((type) => !type.includes("*"));
    const operation: Record<string, Json> = {
      operationId: method.id,
      ...(tag === undefined ? {} : { tags: [tag] }),
      ...(method.description === undefined ? {} : { description: method.description.trim() }),
      ...(method.deprecated === true ? { deprecated: true } : {}),
      parameters,
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
    if (tag !== undefined && !tags.includes(tag)) tags.push(tag);
  };
  const walk = (resource: Resource, tag: string | undefined) => {
    for (const method of Object.values(resource.methods ?? {})) add(method, tag);
    for (const [name, child] of Object.entries(resource.resources ?? {})) walk(child, tag ?? name);
  };
  walk(d, undefined);
  const stale = [...exclude].filter((id) => !excluded.has(id));
  if (stale.length > 0) throw new Error(`${source} no longer has the excluded ${stale.join(", ")}`);
  return {
    openapi: "3.0.3",
    info: {
      title: d.title,
      version: d.version,
      ...(d.description === undefined ? {} : { description: d.description }),
      "x-executor-discovery": { url: source, revision: d.revision },
    },
    ...(d.documentationLink === undefined ? {} : { externalDocs: { url: d.documentationLink } }),
    servers: [{ url: d.rootUrl.replace(/\/$/, "") }],
    security: [{ bearer: [] }],
    tags: tags.map((name) => ({ name })),
    paths,
    components: {
      schemas: Object.fromEntries(Object.entries(d.schemas ?? {}).map(([name, value]) => [name, schema(value)])),
      securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
    },
  };
};

const root = new URL("..", import.meta.url).pathname;
const wanted = process.argv.slice(2);
for (const name of wanted) if (apis[name] === undefined) throw new Error(`Unknown API ${name}; known: ${Object.keys(apis).join(", ")}`);
for (const [name, { discovery, out, exclude = {} }] of Object.entries(apis)) {
  if (wanted.length > 0 && !wanted.includes(name)) continue;
  const response = await fetch(discovery);
  if (!response.ok) throw new Error(`${discovery} answered HTTP ${response.status}`);
  const d = (await response.json()) as Discovery;
  const document = convert(d, discovery, new Set(Object.keys(exclude)));
  writeFileSync(join(root, out), `${JSON.stringify(document, null, 1)}\n`);
  console.log(`${name}: wrote ${out} (revision ${d.revision})`);
}
