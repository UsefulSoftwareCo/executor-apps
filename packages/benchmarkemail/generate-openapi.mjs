// Converts Benchmark Email's official Postman collection (the source of https://developer.benchmarkemail.com/)
// into the OpenAPI 3.0 document in document.json. Usage: node generate-openapi.mjs <collection.json> > document.json
// Download the collection from:
// https://developer.benchmarkemail.com/api/collections/1505830/RVfsHZ2Y?segregateAuth=true&versionTag=latest
import { readFileSync } from "node:fs";

const collection = JSON.parse(readFileSync(process.argv[2], "utf8"));
const ORIGIN = "https://clientapi.benchmarkemail.com";
const clean = (s) => s.replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w[0].toLowerCase() + w.slice(1))).join("");
const decode = (s) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;| /g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

const requests = [];
const walk = (items, folders) => {
  for (const item of items) {
    if (item.item) walk(item.item, [...folders, item.name]);
    else requests.push({ folders, item });
  }
};
walk(collection.item, []);

const paths = {};
const seen = new Set();
const ids = new Set();
let skipped = 0;
for (const { folders, item } of requests) {
  const req = item.request;
  let raw = typeof req.url === "string" ? req.url : req.url.raw;
  // restapi.benchmarkemail.com is not a declared host. A request listed there is kept only when the
  // collection also records a clientapi example URL for the same path; otherwise it is skipped.
  if (new URL(raw.replace(/\{\{[^}]*\}\}/g, "x")).hostname !== "clientapi.benchmarkemail.com") {
    const path = (u) => new URL(u.replace(/\{\{[^}]*\}\}/g, "x")).pathname.replace(/\/+$/, "");
    const example = (item.response ?? []).map((r) => r.originalRequest?.url).map((u) => (typeof u === "string" ? u : u?.raw)).find((u) => u && u.startsWith(ORIGIN) && path(u) === path(raw));
    if (!example) { skipped++; continue; }
    raw = example;
  }
  let url;
  try {
    url = new URL(raw.replace(/\{\{([^}]*)\}\}/g, (_, n) => `__P__${clean(n)}__E__`));
  } catch {
    skipped++;
    continue;
  }
  const method = req.method.toLowerCase();
  const pathTemplate = url.pathname.replace(/__P__(.*?)__E__/g, "{$1}").replace(/%7B/gi, "{").replace(/%7D/gi, "}").replace(/\/+$/, "") || "/";
  const pathNames = [...pathTemplate.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  if (pathNames.some((n) => !n)) { skipped++; continue; }
  const key = `${method} ${pathTemplate.replace(/\{[^}]+\}/g, "{}")}`;
  if (seen.has(key)) { skipped++; continue; }
  seen.add(key);

  const parameters = pathNames.map((name) => ({ name, in: "path", required: true, schema: { type: "string" } }));
  const queryNames = new Set();
  for (const [name, value] of url.searchParams) {
    if (queryNames.has(name)) continue;
    queryNames.add(name);
    parameters.push({ name, in: "query", required: false, schema: { type: "string" } });
  }

  let requestBody;
  if (req.body?.mode === "raw" && req.body.raw?.trim()) {
    const props = {};
    for (const m of req.body.raw.matchAll(/"([A-Za-z][A-Za-z0-9_]*)"\s*:/g)) props[m[1]] = {};
    requestBody = {
      required: false,
      content: { "application/json": { schema: { type: "object", properties: props, additionalProperties: true } } },
    };
  } else if (["post", "patch", "put"].includes(method)) {
    requestBody = { required: false, content: { "application/json": { schema: { type: "object", additionalProperties: true } } } };
  }

  const description = decode(String(req.description?.content ?? req.description ?? "")).slice(0, 600);
  let operationId = clean(`${folders.join(" ")} ${item.name}`) || `op${requests.indexOf(item)}`;
  while (ids.has(operationId)) operationId += "X";
  ids.add(operationId);
  (paths[pathTemplate] ??= {})[method] = {
    operationId,
    summary: item.name.trim(),
    ...(description ? { description } : {}),
    tags: [folders[0] ?? "General"],
    parameters,
    ...(requestBody ? { requestBody } : {}),
    responses: { 200: { description: "OK", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } } },
  };
}

const doc = {
  openapi: "3.0.3",
  info: { title: "Benchmark Email API", version: "3.0", description: "Converted from Benchmark Email's official Postman collection (https://developer.benchmarkemail.com/)." },
  servers: [{ url: ORIGIN }],
  security: [{ AuthToken: [] }],
  components: { securitySchemes: { AuthToken: { type: "apiKey", name: "AuthToken", in: "header" } } },
  paths,
};
process.stdout.write(JSON.stringify(doc));
console.error(`operations: ${seen.size}, skipped: ${skipped}`);
