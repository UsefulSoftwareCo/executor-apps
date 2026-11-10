// Regenerates openapi.json from the Mitti developer portal.
//
//   node packages/safetyculture/fetch-openapi.mjs [out.json]
//
// The portal publishes no combined document. https://developer.mitti.com/llms.txt indexes
// every reference page; each endpoint page (`.md`) embeds its official OpenAPI 3.1 definition
// in the json code block under "# OpenAPI definition". This script fetches every page that has
// such a block and merges paths and components. The top-level `info` and `servers` are
// synthesized here (the pages each carry their own info and no usable combined servers list).
// Default output is openapi.json next to this file.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const out = process.argv[2] ?? fileURLToPath(new URL("./openapi.json", import.meta.url));
const headers = { "user-agent": "Mozilla/5.0" };

const index = await (await fetch("https://developer.mitti.com/llms.txt", { headers })).text();
const urls = [...new Set([...index.matchAll(/\((https:\/\/developer\.mitti\.com\/reference\/[^)\s]+\.md)\)/g)].map((m) => m[1]))];

const merged = {
  openapi: "3.1.0",
  info: { title: "SafetyCulture (Mitti) API", version: "merged" },
  servers: [{ url: "https://api.safetyculture.io" }],
  paths: {},
  components: {},
};
const skipped = [];
let fetched = 0;

async function load(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.text();
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw new Error(`failed to fetch ${url}`);
}

async function take(url) {
  const text = await load(url);
  const m = text.match(/# OpenAPI definition\s*(`{3,})json\n([\s\S]*?)\n\1/);
  if (!m) return skipped.push(url);
  const doc = JSON.parse(m[2]);
  fetched++;
  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    const target = (merged.paths[path] ??= {});
    for (const [method, op] of Object.entries(item)) {
      if (target[method] && JSON.stringify(target[method]) !== JSON.stringify(op)) {
        throw new Error(`conflicting operation ${method} ${path} (${url})`);
      }
      target[method] = op;
    }
  }
  for (const [kind, entries] of Object.entries(doc.components ?? {})) {
    const target = (merged.components[kind] ??= {});
    for (const [name, value] of Object.entries(entries)) {
      if (target[name] && JSON.stringify(target[name]) !== JSON.stringify(value)) {
        throw new Error(`conflicting component ${kind}/${name} (${url})`);
      }
      target[name] = value;
    }
  }
}

for (let i = 0; i < urls.length; i += 3) await Promise.all(urls.slice(i, i + 3).map(take));

const methods = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
const ops = Object.values(merged.paths).flatMap((item) => Object.keys(item).filter((k) => methods.includes(k)));
writeFileSync(out, `${JSON.stringify(merged, null, 2)}\n`);
console.log(`pages indexed ${urls.length}, with OpenAPI ${fetched}, without ${skipped.length}`);
console.log(`operations ${ops.length}, mutations ${ops.filter((m) => m !== "get").length}`);
for (const u of skipped) console.log(`skipped ${u}`);
