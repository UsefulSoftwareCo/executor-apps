import type { OpenapiToolNamesOptions } from "apps/openapi";

// AnyDB's own "Ext Integration API" document, linked from https://www.anydb.com/support/integrations/api.
export const options = {
  source: { url: "https://www.anydb.com/openapi/spec.yaml" },
  allowedOrigin: "https://app.anydb.com",
  securitySchemes: {
    AnyDbApiKey: { type: "apiKey", in: "header", name: "x-anydb-api-key" },
    AnyDbEmail: { type: "apiKey", in: "header", name: "x-anydb-email" },
  },
  methods: {
    apiKey: [
      { scheme: "AnyDbApiKey", field: "apiKey", part: "value", prefix: "" },
      { scheme: "AnyDbEmail", field: "email", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
