import type { OpenapiToolNamesOptions } from "apps/openapi";

// Docsumo's own ReadMe-hosted document (id from the oasPublicUrl on support.docsumo.com/reference)
// declares no security scheme: every operation takes a required `apikey` header, supplied from the
// account by parameterDefaults in index.ts.
export const options = {
  source: { url: "https://dash.readme.com/api/v1/api-registry/l95kgmc1nkqh0" },
  allowedOrigin: "https://app.docsumo.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "apikey" } },
  fallbackSecurity: [{ apiKey: [] }],
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
