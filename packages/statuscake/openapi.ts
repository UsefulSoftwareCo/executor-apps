import type { OpenapiToolNamesOptions } from "apps/openapi";

// The Swagger 2.0 document declares no security scheme, so declare the bearer one here.
const patches = [{ op: "add", path: "/security", value: [{ bearerAuth: [] }] }] as unknown as NonNullable<
  OpenapiToolNamesOptions["patches"]
>;

export const options = {
  source: { url: "https://developers.statuscake.com/redocusaurus/plugin-redoc-0.yaml" },
  baseUrl: "https://api.statuscake.com/v1",
  allowedOrigin: "https://api.statuscake.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
