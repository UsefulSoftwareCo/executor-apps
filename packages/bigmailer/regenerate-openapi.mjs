// Rebuilds openapi.json from BigMailer's per-operation reference pages.
// Usage: node regenerate-openapi.mjs [--check]
//   (no flag) writes openapi.json; --check compares with the committed file.
// Source index: https://docs.bigmailer.io/llms.txt (every /reference/<operation>.md page).
import { readFileSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";

const INDEX = "https://docs.bigmailer.io/llms.txt";
const OUT = new URL("./openapi.json", import.meta.url);

const text = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.text();
};

const urls = [
  ...new Set((await text(INDEX)).match(/https:\/\/docs\.bigmailer\.io\/reference\/[^\s)]+\.md/g) ?? []),
].sort();
if (urls.length !== 80) throw new Error(`expected 80 reference pages, found ${urls.length}`);

const merged = { openapi: "3.1.0", info: null, servers: null, paths: {}, components: {}, security: [{ APIKey: [] }] };
for (const url of urls) {
  const md = await text(url);
  const m = md.match(/# OpenAPI definition\s+```json\n([\s\S]*?)\n```/);
  if (!m) throw new Error(`${url}: no OpenAPI block`);
  const doc = JSON.parse(m[1]);
  merged.openapi = doc.openapi;
  merged.info ??= doc.info;
  merged.servers ??= doc.servers;
  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    merged.paths[path] = { ...(merged.paths[path] ?? {}), ...item };
  }
  for (const [kind, entries] of Object.entries(doc.components ?? {})) {
    merged.components[kind] = { ...(merged.components[kind] ?? {}), ...entries };
  }
}

if (process.argv.includes("--check")) {
  const current = JSON.parse(readFileSync(OUT, "utf8"));
  const same = isDeepStrictEqual(current.paths, merged.paths) && isDeepStrictEqual(current.components, merged.components);
  console.log(same ? "openapi.json matches the vendor pages" : "openapi.json DIFFERS from the vendor pages");
  process.exit(same ? 0 : 1);
}
writeFileSync(OUT, JSON.stringify(merged, null, 2) + "\n");
console.log(`wrote ${urls.length} operations`);
