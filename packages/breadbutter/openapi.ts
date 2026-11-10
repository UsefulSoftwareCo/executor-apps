import type { OpenapiToolNamesOptions } from "apps/openapi";
import { bodyPatches } from "./bodies.ts";

// Bread & Butter's official Swagger 2.0 document (https://api.breadbutter.io/openapi.json) declares
// a single scheme, an apiKey in the `Authorization` header (named "Bearer"), and attaches it to no
// operation. No resolvable vendor page documents any other header, so that declared scheme is used
// as the global requirement and the user's app secret is sent as its value. UNVERIFIED: no real
// call was made and the vendor does not document what the value is.
const patches = [
  { op: "add", path: "/security", value: [{ Bearer: [] }] },
  ...bodyPatches,
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.breadbutter.io/openapi.json" },
  baseUrl: "https://api.breadbutter.io",
  allowedOrigin: "https://api.breadbutter.io",
  securitySchemes: { Bearer: { type: "apiKey", name: "Authorization", in: "header" } },
  methods: { apiKey: [{ scheme: "Bearer", field: "appSecret", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
