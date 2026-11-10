import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: {
    url: "https://storage.googleapis.com/stainless-sdk-openapi-specs/openregister/openregister-4bd4cc957806a1fc7250db66762de302ee6718d21ebe7159b8753af53acc68df.yml",
  },
  allowedOrigin: "https://api.openregister.de",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
