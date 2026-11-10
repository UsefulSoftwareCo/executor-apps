import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.templatefox.com/openapi.json" },
  allowedOrigin: "https://api.templatefox.com",
  // Every operation requires the document's HTTPBearer scheme (JWT), but API keys are sent in
  // x-api-key, so that scheme name is rebound to the API key header.
  securitySchemes: {
    HTTPBearer: { type: "apiKey", in: "header", name: "x-api-key" },
  },
  methods: { apiKey: [{ scheme: "HTTPBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
