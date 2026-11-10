import type { OpenapiToolNamesOptions } from "apps/openapi";

// Encodian Flowr publishes one official Swagger 2.0 document per connector, all on api.apps-encodian.com (ten with Sign).
// index.ts mounts each under its own key. Every document's global security names a "defaultAuth" scheme that the
// document never defines, so the patch points it at the defined "Bearer" scheme (an X-ApiKey header).
const patches = [
  { op: "replace", path: "/security", value: [{ Bearer: [] }] },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

const api = (name: string) =>
  ({
    source: { url: `https://api.apps-encodian.com/swagger/${name}/swagger.json` },
    baseUrl: "https://api.apps-encodian.com",
    allowedOrigin: "https://api.apps-encodian.com",
    securitySchemes: { Bearer: { type: "apiKey", in: "header", name: "X-ApiKey" } },
    methods: { apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }] },
    patches,
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const apis = {
  word: api("Word"),
  pdf: api("PDF"),
  excel: api("Excel"),
  powerpoint: api("PowerPoint"),
  image: api("Image"),
  barcode: api("Barcode"),
  conversion: api("Conversion"),
  general: api("General"),
  utilities: api("Utilities"),
  sign: api("Sign"),
} as const;

// scripts/tools.ts reads `options`; check every mount with `node scripts/tools.ts` after temporarily switching.
export const options = apis.pdf;
