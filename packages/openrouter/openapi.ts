import type { OpenapiToolNamesOptions } from "apps/openapi";

// Source: OpenRouter's official OpenAPI document. Every operation accepts the API key (or a
// management key, for key and guardrail administration) as a bearer token.
export const options = {
  source: { url: "https://openrouter.ai/openapi.json" },
  allowedOrigin: "https://openrouter.ai",
  securitySchemes: { apiKey: { type: "http", scheme: "bearer" }, bearer: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [
      { scheme: "apiKey", field: "token", part: "value", prefix: "" },
      { scheme: "bearer", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
