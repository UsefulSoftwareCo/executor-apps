// Converts Google's Gemini API (generativelanguage v1beta) Discovery document into an OpenAPI 3.0 document.
// Usage: node convert-discovery.mjs <discovery.json> > openapi.json
// Fetch the input from https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta (revision 20261010).
// Credentials are declared in openapi.ts: the `x-goog-api-key` header, or an OAuth bearer token.
// Methods named streamGenerateContent are skipped: they return a chunked JSON/SSE stream that tools cannot consume.
import { readFileSync } from "node:fs";

const d = JSON.parse(readFileSync(process.argv[2], "utf8"));

const schema = (s) => {
  if (!s) return {};
  if (s.$ref) return { $ref: `#/components/schemas/${s.$ref}` };
  const out = {};
  if (s.description) out.description = s.description;
  if (s.type === "any") return out;
  if (s.type) out.type = s.type;
  if (s.format) out.format = s.format;
  if (s.enum) out.enum = s.enum;
  if (s.properties) out.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, schema(v)]));
  if (s.additionalProperties) out.additionalProperties = schema(s.additionalProperties);
  if (s.items) out.items = schema(s.items);
  if (s.type === "object" && !s.properties && !s.additionalProperties) out.additionalProperties = true;
  return out;
};

const param = (name, p, where = p.location) => {
  const base = schema({ type: p.type, format: p.format, enum: p.enum });
  return {
    name,
    in: where,
    required: where === "path" ? true : Boolean(p.required),
    description: p.description,
    schema: p.repeated ? { type: "array", items: base } : base,
  };
};

const paths = {};
const walk = (resources) => {
  for (const r of Object.values(resources ?? {})) {
    for (const m of Object.values(r.methods ?? {})) {
      if (/\.streamGenerateContent$/.test(m.id)) continue;
      // "{+name}" spans slashes ("places/ChIJ..."); the flatPath spells the segments out, so use it and
      // turn every segment into its own path parameter.
      const reserved = m.path.includes("{+");
      const template = reserved && m.flatPath ? m.flatPath : m.path;
      const key = `/${template.replace(/^\//, "").replace(/\{\+(\w+)\}/g, "{$1}")}`;
      const params = [];
      if (reserved && m.flatPath) {
        const original = m.path.match(/\{\+(\w+)\}/)?.[1];
        for (const [, name] of m.flatPath.matchAll(/\{(\w+)\}/g)) {
          params.push({
            name,
            in: "path",
            required: true,
            description: `Segment ${name} of the resource name${original ? ` (${m.parameters?.[original]?.description ?? original})` : ""}.`,
            schema: { type: "string" },
          });
        }
      }
      const skip = new Set(reserved && m.flatPath ? [m.path.match(/\{\+(\w+)\}/)?.[1]] : []);
      for (const [n, p] of Object.entries(m.parameters ?? {})) if (!skip.has(n)) params.push(param(n, p));
      const op = {
        operationId: m.id,
        description: m.description?.trim(),
        parameters: params,
        responses: {
          200: m.response
            ? { description: "Success", content: { "application/json": { schema: schema(m.response) } } }
            : { description: "Success" },
        },
        security: [{ apiKey: [] }],
      };
      if (m.request) op.requestBody = { required: true, content: { "application/json": { schema: schema(m.request) } } };
      (paths[key] ??= {})[m.httpMethod.toLowerCase()] = op;
    }
    walk(r.resources);
  }
};
// Methods can also sit directly on the root (Address Validation has `v1.validateAddress`).
walk(d.resources);
if (d.methods) walk({ root: { methods: d.methods } });

const doc = {
  openapi: "3.0.3",
  info: { title: d.title ?? d.name, version: `${d.version} (discovery revision ${d.revision})`, description: d.description },
  servers: [{ url: (d.rootUrl ?? d.baseUrl).replace(/\/$/, "") }],
  security: [{ apiKey: [] }],
  paths,
  components: {
    schemas: Object.fromEntries(Object.entries(d.schemas ?? {}).map(([k, v]) => [k, schema(v)])),
    securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-goog-api-key" } },
  },
};
process.stdout.write(JSON.stringify(doc) + "\n");
