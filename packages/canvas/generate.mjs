// Regenerates spec.ts: an OpenAPI 3.0 conversion of Instructure's official Canvas LMS REST API
// documentation, which is published as Swagger 1.2 resource files at
// https://canvas.instructure.com/doc/api/api-docs.json. Usage: node packages/canvas/generate.mjs
import { writeFileSync } from "node:fs";

const root = "https://canvas.instructure.com/doc/api";
const index = await (await fetch(`${root}/api-docs.json`)).json();

const resources = await Promise.all(
  index.apis.map(async (api) => {
    const response = await fetch(root + api.path.replace(/\(/g, "%28").replace(/\)/g, "%29"));
    if (!response.ok) throw new Error(`${api.path}: ${response.status}`);
    return { tag: api.description, doc: await response.json() };
  }),
);

const clip = (text, max) => {
  const clean = String(text ?? "").replace(/\{api:[^ }]+ ([^}]*)\}/g, "$1").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

const scalar = (p) => {
  const t = String(p.type ?? "").toLowerCase();
  const schema =
    t === "integer" || t === "positive integer"
      ? { type: "integer" }
      : t === "number" || t === "numeric"
        ? { type: "number" }
        : t === "boolean"
          ? { type: "boolean" }
          : t === "hash" || t === "object" || t === "json" || t === "serializedhash" || t === "variable"
            ? { type: "object", additionalProperties: true }
            : { type: "string" };
  if (p.enum && schema.type === "string") schema.enum = p.enum;
  return schema;
};

const itemSchema = (p) => {
  const items = p.items ?? {};
  const t = String(items.type ?? items.$ref ?? "string").toLowerCase();
  if (t === "integer" || t === "[integer]") return { type: "integer" };
  if (t === "number") return { type: "number" };
  if (t === "boolean") return { type: "boolean" };
  if (t === "string" || t === "datetime" || t === "date") return { type: "string" };
  return { type: "object", additionalProperties: true };
};

const isArray = (p) => ["array", "string[]", "[answer]", "multiple blueprintrestrictions"].includes(String(p.type).toLowerCase());
const schemaOf = (p) => (isArray(p) ? { type: "array", items: itemSchema(p) } : scalar(p));

// A body parameter named `a[b][]` becomes { a: { b: [ ... ] } }.
const segments = (name) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*(\[[A-Za-z_][A-Za-z0-9_]*\])*(\[\])?$/.test(name)) return undefined;
  const parts = [...name.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)].map((m) => m[0]);
  return { parts, list: name.endsWith("[]") };
};

const operations = new Map();
const paths = {};
const usedIds = new Set();
const tagDescriptions = new Map();

for (const { tag, doc } of resources) {
  tagDescriptions.set(tag, tag);
  for (const api of doc.apis) {
    const path = api.path.replace(/^\/v1(?=\/)/, "/v1").replace(/:([A-Za-z_]+)/g, "{$1}");
    for (const op of api.operations) {
      const method = op.method.toLowerCase();
      const key = `${method} ${path}`;
      if (operations.has(key)) continue;
      operations.set(key, true);

      let id = op.nickname.replace(/[^A-Za-z0-9_]/g, "_");
      for (let n = 2; usedIds.has(id); n++) id = `${op.nickname}_${n}`;
      usedIds.add(id);

      const parameters = [];
      const props = {};
      const required = [];
      const pathParams = new Set([...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]));
      const seenQuery = new Set();

      for (const p of op.parameters ?? []) {
        if (p.paramType === "path") {
          if (!pathParams.has(p.name)) continue;
          parameters.push({ name: p.name, in: "path", required: true, description: clip(p.description, 400), schema: { type: "string" } });
          pathParams.delete(p.name);
        } else if (p.paramType === "query") {
          if (!/^[A-Za-z_][A-Za-z0-9_]*(\[[A-Za-z_][A-Za-z0-9_]*\])*(\[\])?$/.test(p.name)) continue;
          const schema = schemaOf(p);
          // Canvas reads repeated values as `name[]=a&name[]=b`.
          const name = schema.type === "array" && !p.name.endsWith("[]") ? `${p.name}[]` : p.name;
          if (seenQuery.has(name)) continue;
          seenQuery.add(name);
          parameters.push({ name, in: "query", required: p.required === true, description: clip(p.description, 600), schema });
        } else if (p.paramType === "form") {
          const seg = segments(p.name);
          if (!seg) continue;
          let schema = schemaOf(p);
          if (seg.list && schema.type !== "array") schema = { type: "array", items: schema };
          let node = props;
          let ok = true;
          seg.parts.forEach((part, i) => {
            if (!ok) return;
            if (i === seg.parts.length - 1) {
              if (node[part] === undefined) node[part] = { ...schema, description: clip(p.description, 600) };
              else ok = false;
            } else {
              const next = (node[part] ??= { type: "object", properties: {} });
              if (next.type !== "object" || next.properties === undefined) ok = false;
              else node = next.properties;
            }
          });
          if (ok && seg.parts.length === 1 && p.required === true) required.push(seg.parts[0]);
        }
      }
      // Undeclared path parameters still need declaring for the path to resolve.
      for (const name of pathParams) parameters.unshift({ name, in: "path", required: true, schema: { type: "string" } });

      const operation = {
        operationId: id,
        tags: [tag],
        summary: clip(op.summary, 200),
        description: clip(op.notes || op.summary, 1500),
        parameters,
        responses: { 200: { description: "Success", content: { "application/json": { schema: {} } } } },
      };
      if (Object.keys(props).length > 0 && method !== "get" && method !== "delete") {
        operation.requestBody = {
          required: required.length > 0,
          content: {
            "application/json": {
              schema: { type: "object", properties: props, ...(required.length > 0 ? { required } : {}) },
            },
          },
        };
      }
      (paths[path] ??= {})[method] = operation;
    }
  }
}

const document = {
  openapi: "3.0.3",
  info: {
    title: "Canvas LMS REST API",
    version: "1.0",
    description: "Converted from Instructure's Swagger 1.2 API documentation (canvas.instructure.com/doc/api).",
  },
  servers: [{ url: "https://canvas.instructure.com/api" }],
  tags: [...tagDescriptions.keys()].map((name) => ({ name })),
  paths,
};

const count = Object.values(paths).reduce((n, item) => n + Object.keys(item).length, 0);
writeFileSync(
  new URL("./spec.ts", import.meta.url),
  `// Generated by generate.mjs from Instructure's official Canvas API documentation. Do not edit.\n` +
    `export const document = JSON.parse(${JSON.stringify(JSON.stringify(document))});\n`,
);
console.log(`wrote ${count} operations`);
