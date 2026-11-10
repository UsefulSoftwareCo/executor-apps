import type { OpenapiToolNamesOptions } from "apps/openapi";

// ChMeetings' official OpenAPI 3.1 document; the API key travels in the `apikey` header.
export const options = {
  source: { url: "https://api.chmeetings.com/openapi/v1.json" },
  allowedOrigin: "https://api.chmeetings.com",
  securitySchemes: { ApiKey: { type: "apiKey", in: "header", name: "apikey" } },
  methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
