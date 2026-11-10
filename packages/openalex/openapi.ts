import type { OpenapiToolNamesOptions } from "apps/openapi";

// OpenAlex's own OpenAPI document declares an `api_key` query parameter. The API accepts the same key as a bearer
// token (https://help.openalex.org/api/authentication), so the scheme is overridden to keep the key out of the URL.
export const options = {
  source: { url: "https://help.openalex.org/openapi.json" },
  allowedOrigin: "https://api.openalex.org",
  securitySchemes: { apiKey: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
