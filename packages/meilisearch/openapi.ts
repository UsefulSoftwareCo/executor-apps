import type { OpenapiToolNamesOptions } from "apps/openapi";

// Meilisearch's official OpenAPI document (meilisearch/open-api). Its server is the relative "/",
// so index.ts supplies the account's own instance URL as baseUrl.
export const placeholderOrigin = "https://ms.example.com";

export const options = {
  source: { url: "https://raw.githubusercontent.com/meilisearch/open-api/main/open-api.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "Bearer", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
