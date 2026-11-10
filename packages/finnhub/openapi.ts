import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document declares the key as a `token` query parameter, which is the only form the vendor
// documents (its Swagger and official Python client). No vendor doc covers a header, so the
// package uses the documented query parameter as-is.
export const options = {
  source: { url: "https://finnhub.io/static/swagger.json" },
  allowedOrigin: "https://finnhub.io",
  securitySchemes: { api_key: { type: "apiKey", in: "query", name: "token" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // The document gives this operation no `responses`, which the compiler rejects.
  patches: [
    {
      op: "add",
      path: "/paths/~1global-filings~1download/get/responses",
      value: { "200": { description: "Filing content" } },
    },
  ],
} satisfies OpenapiToolNamesOptions;
