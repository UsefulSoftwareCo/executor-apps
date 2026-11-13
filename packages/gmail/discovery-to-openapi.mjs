// Converts Google's Gmail v1 Discovery document into the vendored gmail-openapi.json.
// Usage: node discovery-to-openapi.mjs <discovery.json> > gmail-openapi.json
// Fetch the input from https://gmail.googleapis.com/$discovery/rest?version=v1
// The same converter as packages/google-drive's, with Gmail's settings below.
import { readFileSync } from "node:fs";

const d = JSON.parse(readFileSync(process.argv[2], "utf8"));

// Package settings. A method that takes content (`supportsMediaUpload`) also gets a `<id>Media`
// operation: a simple upload (`uploadType=media`) to Discovery's `/upload/...` path whose body is
// the content itself. Gmail's uploads take a whole RFC 822 message.
const MEDIA_TYPES = ["message/rfc822"];
const rfc822 =
  "The body is the whole RFC 822 message (headers and body), base64-encoded. " +
  "For an ordinary message, the JSON operation with a base64url `raw` field is simpler and also takes threadId; " +
  "use this upload for large messages.";
/** What an agent must know about each upload operation, by Discovery method id. */
const MEDIA_NOTES = Object.fromEntries(
  ["drafts.create", "drafts.update", "drafts.send", "messages.send", "messages.insert", "messages.import"].map((id) => [
    `gmail.users.${id}`,
    rfc822,
  ]),
);
/**
 * Tag every operation with its top-level Discovery resource (false: group operations by path).
 * Gmail's paths all start with /gmail/v1/users, so tags keep its tools under `users`.
 */
const RESOURCE_TAGS = true;

// Mirrors the apps runtime: these types take the body as text, every other type as base64 bytes.
const textMedia = (type) => /^(?:text\/|application\/(?:[\w.-]+\+)?(?:json|xml))/i.test(type);
// Mirrors the apps runtime's grouping, so an upload operation sits beside its JSON operation.
const groupOf = (op, key) =>
  op.tags?.[0] ??
  key.split("/").find((segment) => segment !== "" && !/^v\d+(?:[._-]\d+)?$/i.test(segment) && segment !== "api" && !segment.startsWith("{"));
const size = (bytes) => {
  const units = ["bytes", "KiB", "MiB", "GiB", "TiB"];
  let value = Number(bytes);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) [value, unit] = [value / 1024, unit + 1];
  return `${Number(value.toFixed(1))} ${units[unit]}`;
};

const schema = (s) => {
  if (!s) return {};
  if (s.$ref) return { $ref: `#/components/schemas/${s.$ref}` };
  const out = {};
  if (s.description) out.description = s.description;
  if (s.type === "any") return out;
  if (s.type) out.type = s.type;
  if (s.format) out.format = s.format;
  if (s.enum) out.enum = s.enum;
  if (s.properties) {
    out.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, schema(v)]));
  }
  if (s.additionalProperties) out.additionalProperties = schema(s.additionalProperties);
  if (s.items) out.items = schema(s.items);
  return out;
};

const param = (name, p) => {
  const base = schema({ type: p.type, format: p.format, enum: p.enum });
  return {
    name,
    in: p.location,
    required: p.location === "path" ? true : Boolean(p.required),
    description: p.description,
    schema: p.repeated ? { type: "array", items: base } : base,
  };
};

const paths = {};
const walk = (resources) => {
  for (const r of Object.values(resources ?? {})) {
    for (const m of Object.values(r.methods ?? {})) {
      const key = `/${m.path.replace(/^\//, "")}`;
      const params = Object.entries(m.parameters ?? {}).map(([n, p]) => param(n, p));
      params.push({ name: "fields", in: "query", required: false, description: d.parameters.fields.description, schema: { type: "string" } });
      const op = {
        operationId: m.id,
        ...(RESOURCE_TAGS ? { tags: [m.id.split(".")[1]] } : {}),
        description: m.description?.trim(),
        parameters: params,
        responses: {
          200: m.response
            ? { description: "Success", content: { "application/json": { schema: schema(m.response) } } }
            : { description: "Success" },
        },
        security: [{ bearer: [] }],
      };
      if (m.request) {
        op.requestBody = { required: true, content: { "application/json": { schema: schema(m.request) } } };
      }
      const simple = m.supportsMediaUpload ? m.mediaUpload?.protocols?.simple : undefined;
      if (simple) op.description = `${op.description}\n\nThis operation sends metadata only. To send content, use ${m.id}Media.`;
      (paths[key] ??= {})[m.httpMethod.toLowerCase()] = op;
      if (simple) {
        const uploadKey = `/${simple.path.replace(/^\//, "")}`;
        const limit = m.mediaUpload.maxSize ? ` Google accepts up to ${size(m.mediaUpload.maxSize)}, but the content travels inside the tool call, so keep it to a few MB.` : "";
        (paths[uploadKey] ??= {})[m.httpMethod.toLowerCase()] = {
          ...op,
          operationId: `${m.id}Media`,
          tags: [groupOf(op, key)],
          description:
            `Simple media upload for ${m.id}: the request body is the content itself, ` +
            `sent to ${uploadKey} with uploadType=media.${limit} ` +
            `Metadata in ${m.id}'s JSON body cannot be set here. ${MEDIA_NOTES[m.id] ?? ""}\n\n${m.description?.trim()}`,
          servers: [{ url: d.rootUrl.replace(/\/$/, "") }],
          parameters: [
            ...params.slice(0, -1),
            {
              name: "uploadType",
              in: "query",
              required: true,
              description: "Upload protocol. Only a simple upload, `media`, is supported here.",
              schema: { type: "string", enum: ["media"] },
            },
            params.at(-1),
          ],
          requestBody: {
            required: true,
            content: Object.fromEntries(
              MEDIA_TYPES.map((type) => [
                type,
                { schema: textMedia(type) ? { type: "string" } : { type: "string", format: "binary" } },
              ]),
            ),
          },
        };
      }
    }
    walk(r.resources);
  }
};
walk(d.resources);

const doc = {
  openapi: "3.0.3",
  info: {
    title: d.title,
    version: `${d.version} (discovery revision ${d.revision})`,
    description: d.description,
  },
  servers: [{ url: d.baseUrl.replace(/\/$/, "") }],
  security: [{ bearer: [] }],
  paths,
  components: {
    schemas: Object.fromEntries(Object.entries(d.schemas).map(([k, v]) => [k, schema(v)])),
    securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  },
};
process.stdout.write(JSON.stringify(doc, null, 1) + "\n");
