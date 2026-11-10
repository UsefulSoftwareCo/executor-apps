// Converts Google's BigQuery v2 Discovery document to an OpenAPI 3.0 document.
import { readFileSync, writeFileSync } from "node:fs";
const [inFile, outFile] = process.argv.slice(2);
const d = JSON.parse(readFileSync(inFile, "utf8"));
const conv = (s) => {
  if (!s || typeof s !== "object") return s;
  if (s.$ref) return { $ref: `#/components/schemas/${s.$ref}`, ...(s.description ? {} : {}) };
  const o = {};
  if (s.description) o.description = s.description;
  if (s.type && s.type !== "any") o.type = s.type;
  if (s.format) o.format = s.format;
  if (s.enum) o.enum = s.enum;
  if (s.default !== undefined && s.type !== "any") o.default = s.default;
  if (s.items) o.items = conv(s.items);
  if (s.properties) o.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, conv(v)]));
  if (s.additionalProperties) o.additionalProperties = conv(s.additionalProperties);
  if (s.type === "object" && !s.properties && !s.additionalProperties) o.additionalProperties = true;
  return o;
};
const paths = {};
const walk = (res) => {
  for (const m of Object.values(res.methods ?? {})) {
    // The IAM methods all share the template "{+resource}:verb", which would collide as OpenAPI
    // paths; their flatPath spells out the resource collections, so use that and expand the
    // "resource" parameter into one path parameter per flatPath segment.
    const expand = m.path.includes("{+resource}");
    const p = "/" + (expand ? m.flatPath : m.path).replace(/\{\+(\w+)\}/g, "{$1}");
    const params = [];
    if (expand) {
      for (const [, name] of m.flatPath.matchAll(/\{(\w+)\}/g)) {
        params.push({ name, in: "path", required: true, description: `Identifier segment ${name} of the resource.`, schema: { type: "string" } });
      }
    }
    for (const [name, v] of Object.entries(m.parameters ?? {})) {
      if (expand && name === "resource") continue;
      let schema = conv({ type: v.type, format: v.format, enum: v.enum, default: v.default });
      if (v.repeated) schema = { type: "array", items: schema };
      params.push({ name, in: v.location, required: !!v.required || v.location === "path", description: v.description, schema });
    }
    const op = {
      operationId: m.id,
      description: m.description,
      parameters: params,
      responses: {
        200: {
          description: "Successful response",
          ...(m.response ? { content: { "application/json": { schema: conv(m.response) } } } : {}),
        },
      },
      security: [{ Oauth2: m.scopes ?? [] }],
    };
    if (m.request) op.requestBody = { required: true, content: { "application/json": { schema: conv(m.request) } } };
    (paths[p] ??= {})[m.httpMethod.toLowerCase()] = op;
  }
  for (const r of Object.values(res.resources ?? {})) walk(r);
};
walk(d);
const doc = {
  openapi: "3.0.3",
  info: { title: d.title, version: d.version, description: d.description },
  servers: [{ url: d.baseUrl.replace(/\/$/, "") }],
  paths,
  components: {
    schemas: Object.fromEntries(Object.entries(d.schemas).map(([k, v]) => [k, conv(v)])),
    securitySchemes: { Oauth2: { type: "http", scheme: "bearer" } },
  },
};
writeFileSync(outFile, JSON.stringify(doc));
console.log(Object.values(paths).reduce((n, p) => n + Object.keys(p).length, 0), "operations");
