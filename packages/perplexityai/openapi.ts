import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.perplexity.ai/openapi.json" },
  allowedOrigin: "https://api.perplexity.ai",
  securitySchemes: { HTTPBearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "HTTPBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
