import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: {
    url: "https://storage.googleapis.com/stainless-sdk-openapi-specs/writerai/writer-0aff90cfbc9dc550cf49aed4150d2aeb099265f098fc58276407207a4c803344.yml",
  },
  allowedOrigin: "https://api.writer.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
