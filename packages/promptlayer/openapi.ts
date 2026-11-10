import type { OpenapiToolNamesOptions } from "apps/openapi";

// The vendor's published document declares no servers, so the API origin is set here.
export const options = {
  source: { url: "https://docs.promptlayer.com/openapi.json" },
  baseUrl: "https://api.promptlayer.com",
  allowedOrigin: "https://api.promptlayer.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-KEY" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
