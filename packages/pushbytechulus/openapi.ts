import type { OpenapiToolNamesOptions } from "apps/openapi";

// Push's own OpenAPI document (v1.0.11). The key-in-URL variants (/notify/{apiKey}) declare no
// security scheme, so they are the only operations that would put the key in a path or query.
export const options = {
  source: { url: "https://docs.push.techulus.com/openapi.yaml" },
  allowedOrigin: "https://push.techulus.com",
  securitySchemes: { api_key_header: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "api_key_header", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
