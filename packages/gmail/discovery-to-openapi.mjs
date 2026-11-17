// Converts Google's Gmail v1 Discovery document into the vendored gmail-openapi.json.
// Usage: node discovery-to-openapi.mjs <discovery.json> > gmail-openapi.json
// Fetch the input from https://gmail.googleapis.com/$discovery/rest?version=v1
// Derived from packages/google-drive's converter, with Gmail's settings below. Unlike that one, it
// keeps all of Google's standard parameters and writes its output in a fixed order.
import { readFileSync } from "node:fs";

const d = JSON.parse(readFileSync(process.argv[2], "utf8"));

// Package settings. A method that takes content (`supportsMediaUpload`) also gets a `<id>Media`
// operation: a simple upload (`uploadType=media`) to Discovery's `/upload/...` path whose body is
// the content itself. Gmail's uploads take a whole RFC 822 message. Gmail's JSON operations take
// the whole message too, as base64url `raw`, so they stay the ordinary way to send.
const MEDIA_TYPES = ["message/rfc822"];
const rfc822 =
  "The body is the whole RFC 822 message (headers and body), base64-encoded. " +
  "The JSON operation takes the same message as base64url `raw` and is the usual choice; it also sets threadId (needed for a reply) and labelIds, which this upload cannot. " +
  "This is a simple upload of one request: multipart and resumable uploads are not supported.";
/** What an agent must know about each upload operation, by Discovery method id. */
const MEDIA_NOTES = {
  ...Object.fromEntries(["drafts.create", "messages.send", "messages.insert", "messages.import"].map((id) => [`gmail.users.${id}`, rfc822])),
  "gmail.users.drafts.update": `${rfc822} To replace a draft's message and then send it, call this with the draft's id, then the JSON drafts.send with that id.`,
};
/**
 * Methods that get no upload operation, and why. drafts.send must name the draft it sends, and a
 * simple upload carries only the message, with no way to give the draft's id.
 */
const NO_MEDIA = {
  "gmail.users.drafts.send": "a simple upload cannot carry the id of the draft to send",
};
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

// Google returns the Discovery document's keys in a different order on every fetch, so the output
// is sorted: a refresh then shows only real changes.
const sorted = (record) => Object.entries(record ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

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
    out.properties = Object.fromEntries(sorted(s.properties).map(([k, v]) => [k, schema(v)]));
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

// Google's standard parameters, accepted by every method. `uploadType` on an upload operation is
// replaced by the one value supported there.
const standard = sorted(d.parameters).map(([n, p]) => param(n, p));

const paths = {};
const walk = (resources) => {
  for (const [, r] of sorted(resources)) {
    for (const [, m] of sorted(r.methods)) {
      const key = `/${m.path.replace(/^\//, "")}`;
      // Path parameters in the method's own order, then the rest by name.
      const order = m.parameterOrder ?? [];
      const own = sorted(m.parameters).sort(([a], [b]) => (order.includes(a) ? order.indexOf(a) : order.length) - (order.includes(b) ? order.indexOf(b) : order.length));
      const params = own.map(([n, p]) => param(n, p));
      const op = {
        operationId: m.id,
        ...(RESOURCE_TAGS ? { tags: [m.id.split(".")[1]] } : {}),
        description: m.description?.trim(),
        parameters: [...params, ...standard],
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
      (paths[key] ??= {})[m.httpMethod.toLowerCase()] = op;
      const simple = m.supportsMediaUpload && !NO_MEDIA[m.id] ? m.mediaUpload?.protocols?.simple : undefined;
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
            ...params,
            {
              name: "uploadType",
              in: "query",
              required: true,
              description: "Upload protocol. Only a simple upload, `media`, is supported here.",
              schema: { type: "string", enum: ["media"] },
            },
            ...standard.filter((p) => p.name !== "uploadType"),
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
    schemas: Object.fromEntries(sorted(d.schemas).map(([k, v]) => [k, schema(v)])),
    securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  },
};
process.stdout.write(JSON.stringify(doc, null, 1) + "\n");
