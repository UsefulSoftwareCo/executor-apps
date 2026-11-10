import type { OpenapiToolNamesOptions } from "apps/openapi";

// The published document declares no servers; Seqera Cloud is https://api.cloud.seqera.io.
export const options = {
  source: { url: "https://api.cloud.seqera.io/openapi/seqera-api-latest.yml" },
  allowedOrigin: "https://api.cloud.seqera.io",
  baseUrl: "https://api.cloud.seqera.io",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
