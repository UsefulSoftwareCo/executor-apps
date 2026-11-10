import type { OpenapiToolNamesOptions } from "apps/openapi";

// The vendor document declares security [{ api_key: [] }] on every operation. Two download
// operations also declare an optional X-Auth-Token query parameter; remove it so the key is
// only ever sent in the header (patches cannot edit array items, so each parameters list is replaced whole) and never ends up in a URL.
// Array values are valid at runtime; the declared patch type only admits objects.
const downloadParameters = [{ in: "path", name: "list_id", required: true, type: "integer" }, { in: "path", name: "type", required: true, type: "string", enum: ["clean", "dirty", "unknown"], description: "A type can be clean, dirty, unknown" }];
const patches = [
  { op: "replace", path: "/paths/~1downloads~1{list_id}~1{type}/get/parameters", value: downloadParameters },
  { op: "replace", path: "/paths/~1downloads~1json~1{list_id}~1{type}/get/parameters", value: downloadParameters },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.listclean.xyz/v1/spec.json" },
  baseUrl: "https://api.listclean.xyz/v1",
  allowedOrigin: "https://api.listclean.xyz",
  securitySchemes: { api_key: { type: "apiKey", name: "X-Auth-Token", in: "header" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
