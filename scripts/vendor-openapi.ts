// Refreshes the committed copies of vendors' own OpenAPI documents for packages whose vendor
// publishes them only somewhere a live URL source cannot use: an undocumented docs-site asset that
// may move (TomTom), a zip (Apple) or a docs page behind a bot challenge (Lodgify v2).
//
// Each output is the vendor's document, converted from YAML or unzipped where needed, with
// `info.x-executor-source` recording every source URL, its SHA-256 and the retrieval date. A rerun
// whose sources are unchanged leaves the file as it is. Some outputs assemble several of the
// vendor's documents into one so tool names stay stable (TomTom's Search, Geocoding and Reverse
// Geocoding documents were one Search API before): their paths are disjoint, and a component that
// two documents define differently is renamed in the later one (`<prefix><name>`), with its refs.
//
// Usage: node scripts/vendor-openapi.ts <package> [--lodgify-v2 <file>]
//   tomtom           fetches TomTom's API Explorer documents (YAML, converted with js-yaml via npx).
//   apple-app-store  fetches Apple's App Store Connect OpenAPI zip and unpacks it with `unzip`.
//   lodgify          fetches the v1 document from Lodgify's ReadMe API registry. The v2 document is
//                    only served to a browser that passed docs.lodgify.com's Cloudflare check: open
//                    https://docs.lodgify.com/reference/getallpropertiesasync, run
//                    `copy(JSON.stringify((await (await fetch("/lodgify/api-next/v2/branches/1.0/reference/getallpropertiesasync?reduce=false")).json()).data.api))`
//                    in the developer console, save the clipboard to a file and pass it as
//                    --lodgify-v2. Without the flag, only the v1 document is refreshed.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

const isObject = (value: Json | undefined): value is JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const root = new URL("..", import.meta.url).pathname;
const work = mkdtempSync(join(tmpdir(), "vendor-openapi-"));
process.on("exit", () => rmSync(work, { recursive: true, force: true }));

type Fetched = { readonly url: string; readonly sha256: string; readonly document: JsonObject };
type Part = { readonly fetched: Fetched; readonly prefix?: string };
type Output = { readonly file: string; readonly parts: readonly (() => Promise<Part>)[] };

const download = async (url: string): Promise<Buffer> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");

const asDocument = (url: string, value: unknown): JsonObject => {
  if (!isObject(value as Json) || typeof (value as JsonObject).openapi !== "string")
    throw new Error(`${url}: not an OpenAPI 3 document`);
  return value as JsonObject;
};

const json = async (url: string): Promise<Fetched> => {
  const bytes = await download(url);
  return { url, sha256: sha256(bytes), document: asDocument(url, JSON.parse(bytes.toString("utf8"))) };
};

const yaml = async (url: string): Promise<Fetched> => {
  const bytes = await download(url);
  const file = join(work, "document.yml");
  writeFileSync(file, bytes);
  const text = execFileSync("npx", ["--yes", "js-yaml@4.1.0", file], { encoding: "utf8", maxBuffer: 1 << 28 });
  return { url, sha256: sha256(bytes), document: asDocument(url, JSON.parse(text)) };
};

const zipped = async (url: string, entry: string): Promise<Fetched> => {
  const bytes = await download(url);
  const file = join(work, "document.zip");
  writeFileSync(file, bytes);
  const text = execFileSync("unzip", ["-p", file, entry], { encoding: "utf8", maxBuffer: 1 << 28 });
  return { url, sha256: sha256(bytes), document: asDocument(url, JSON.parse(text)) };
};

/** A document saved from a page that only a browser can load (see the header). */
const saved = (url: string, file: string, uri: string): Fetched => {
  const text = readFileSync(file, "utf8");
  const api = JSON.parse(text) as { uri?: string; schema?: unknown };
  if (api.uri !== uri) throw new Error(`${file}: expected the API definition ${uri}, got ${api.uri}`);
  const document = asDocument(file, api.schema);
  return { url, sha256: sha256(JSON.stringify(document)), document };
};

const tomtom = (name: string) => `https://docs.tomtom.com/assets/openapi/${name}`;
const lodgifyV2 = (() => {
  const index = process.argv.indexOf("--lodgify-v2");
  return index === -1 ? undefined : process.argv[index + 1];
})();

const outputs: Record<string, readonly Output[]> = {
  tomtom: [
    {
      file: "search.json",
      parts: [
        async () => ({ fetched: await yaml(tomtom("search-api-explorer.yml")) }),
        async () => ({ fetched: await yaml(tomtom("geocoding_api.yml")), prefix: "Geocoding" }),
        async () => ({ fetched: await yaml(tomtom("reverse_geocoding_api.yml")), prefix: "ReverseGeocoding" }),
      ],
    },
    { file: "routing.json", parts: [async () => ({ fetched: await yaml(tomtom("routing_api.yml")) })] },
    { file: "maps.json", parts: [async () => ({ fetched: await yaml(tomtom("maps_api.yml")) })] },
  ],
  "apple-app-store": [
    {
      file: "openapi.json",
      parts: [
        async () => ({
          fetched: await zipped(
            "https://developer.apple.com/sample-code/app-store-connect/app-store-connect-openapi-specification.zip",
            "openapi.oas.json",
          ),
        }),
      ],
    },
  ],
  lodgify: [
    { file: "v1.json", parts: [async () => ({ fetched: await json("https://dash.readme.com/api/v1/api-registry/1r3vdmvp00hhj") })] },
    ...(lodgifyV2 === undefined
      ? []
      : [
          {
            file: "v2.json",
            parts: [
              async () => ({
                fetched: saved(
                  "https://docs.lodgify.com/lodgify/api-next/v2/branches/1.0/reference/getallpropertiesasync?reduce=false",
                  lodgifyV2,
                  "/branches/1.0/apis/lodgify-public-api-v2.json",
                ),
              }),
            ],
          },
        ]),
  ],
};

/** Renames `#/components/<section>/<name>` refs inside `value` per `renames`. */
const rewriteRefs = (value: Json, renames: ReadonlyMap<string, string>): Json => {
  if (Array.isArray(value)) return value.map((item) => rewriteRefs(item, renames));
  if (!isObject(value)) return value;
  const out: JsonObject = {};
  for (const [key, item] of Object.entries(value))
    out[key] = key === "$ref" && typeof item === "string" ? (renames.get(item) ?? item) : rewriteRefs(item, renames);
  return out;
};

/** Adds `part`'s paths and components to `target`; see the header for the rules. */
const merge = (target: JsonObject, part: JsonObject, prefix: string) => {
  const components = isObject(target.components) ? target.components : (target.components = {});
  const theirs = isObject(part.components) ? part.components : {};
  const renames = new Map<string, string>();
  for (const [section, entries] of Object.entries(theirs)) {
    if (!isObject(entries)) continue;
    const ours = isObject(components[section]) ? components[section] : {};
    for (const [name, value] of Object.entries(entries))
      if (name in ours && JSON.stringify(ours[name]) !== JSON.stringify(value))
        renames.set(`#/components/${section}/${name}`, `#/components/${section}/${prefix}${name}`);
  }
  const rewritten = rewriteRefs(part, renames) as JsonObject;
  for (const [section, entries] of Object.entries(isObject(rewritten.components) ? rewritten.components : {})) {
    if (!isObject(entries)) continue;
    const ours = isObject(components[section]) ? components[section] : (components[section] = {});
    for (const [name, value] of Object.entries(entries)) {
      const key = renames.has(`#/components/${section}/${name}`) ? `${prefix}${name}` : name;
      if (key in ours && JSON.stringify(ours[key]) !== JSON.stringify(value))
        throw new Error(`component ${section}/${key} is defined twice`);
      ours[key] = value;
    }
  }
  const paths = isObject(target.paths) ? target.paths : (target.paths = {});
  for (const [path, item] of Object.entries(isObject(rewritten.paths) ? rewritten.paths : {})) {
    if (path in paths) throw new Error(`path ${path} is in two documents`);
    paths[path] = item;
  }
  if (JSON.stringify(rewritten.servers) !== JSON.stringify(target.servers))
    throw new Error(`documents disagree on servers`);
};

const name = process.argv[2];
const wanted = name === undefined ? undefined : outputs[name];
if (wanted === undefined) {
  console.error(`Usage: node scripts/vendor-openapi.ts <${Object.keys(outputs).join("|")}> [--lodgify-v2 <file>]`);
  process.exit(1);
}
const retrieved = new Date().toISOString().slice(0, 10);
for (const output of wanted) {
  const parts = [];
  for (const load of output.parts) parts.push(await load());
  const sources = parts.map(({ fetched }) => ({ url: fetched.url, sha256: fetched.sha256 }));
  const file = join(root, "packages", name!, output.file);
  if (existsSync(file)) {
    const previous = (JSON.parse(readFileSync(file, "utf8")) as { info?: { "x-executor-source"?: { sources?: unknown } } })
      .info?.["x-executor-source"]?.sources;
    if (JSON.stringify(previous) === JSON.stringify(sources)) {
      console.log(`${name}/${output.file}: unchanged`);
      continue;
    }
  }
  const [first, ...rest] = parts;
  const document = structuredClone(first!.fetched.document);
  for (const part of rest) merge(document, part.fetched.document, part.prefix ?? "");
  const info = isObject(document.info) ? document.info : (document.info = {});
  info["x-executor-source"] = { sources, retrieved, generator: "scripts/vendor-openapi.ts" };
  writeFileSync(file, `${JSON.stringify(document)}\n`);
  const operations = Object.values(isObject(document.paths) ? document.paths : {}).reduce<number>(
    (count, item) =>
      count + (isObject(item) ? Object.keys(item).filter((key) => /^(get|put|post|delete|patch|head|options|trace)$/.test(key)).length : 0),
    0,
  );
  console.log(`${name}/${output.file}: ${operations} operations, ${(Buffer.byteLength(JSON.stringify(document)) / 1024).toFixed(0)} KiB`);
}
