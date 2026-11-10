import type { OpenapiToolNamesOptions } from "apps/openapi";

// Shotstack is one product with three APIs (Edit, Serve, Ingest) on three base paths, described by one
// document: the official bundled OpenAPI from the vendor's @shotstack/schemas npm package (built from
// https://github.com/shotstack/oas-api-definition), pinned to 1.22.0. The bundle declares three servers
// (edit, serve, ingest, each with a version enum of v1 or stage), so index.ts mounts it three times with
// the matching base URL and a patch list that keeps only that API's paths. The v1/stage segment is
// swapped in from the account's environment at call time; v1 here is only used to compile.
const spec = { url: "https://cdn.jsdelivr.net/npm/@shotstack/schemas@1.22.0/dist/api.bundled.json" };

const editPaths = ["/render", "/render/{id}", "/templates", "/templates/{id}", "/templates/render", "/probe/{url}", "/generate", "/generate/quote", "/generate/{id}", "/models", "/models/{id}"];
const servePaths = ["/assets", "/assets/{id}", "/assets/render/{id}"];
const ingestPaths = ["/sources", "/sources/{id}", "/upload"];
const allPaths = [...editPaths, ...servePaths, ...ingestPaths];

const pointer = (path: string) => `/paths/${path.replaceAll("~", "~0").replaceAll("/", "~1")}`;
const without = (keep: string[]) =>
  allPaths.filter((path) => !keep.includes(path)).map((path) => ({ op: "remove" as const, path: pointer(path) }));

const credentials = {
  securitySchemes: { DeveloperKey: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "DeveloperKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const api = (name: string, keep: string[]) =>
  ({
    source: spec,
    allowedOrigin: `https://api.shotstack.io`,
    baseUrl: `https://api.shotstack.io/${name}/v1`,
    ...credentials,
    patches: without(keep),
    // POST /generate/quote is documented as creating no job, reservation or credit usage, so it is a read.
    // POST /upload (getUploadSignedUrl) allocates an upload target, so it stays a mutation and needs approval.
    kinds: { postGenerateQuote: "query" },
  }) satisfies OpenapiToolNamesOptions;

export const editOptions = api("edit", editPaths);
export const serveOptions = api("serve", servePaths);
export const ingestOptions = api("ingest", ingestPaths);
export const options = editOptions;
