import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document declares one apiKey scheme on the Authorization header; the vendor docs say the
// value is `Bearer <API key>`.
export const options = {
  source: { url: "https://apidocs.truelist.io/spec.yaml" },
  allowedOrigin: "https://api.truelist.io",
  securitySchemes: { truelist_auth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "truelist_auth", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
