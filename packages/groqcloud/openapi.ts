import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import spec from "./spec.json" with { type: "json" };

export const options = {
  source: { document: spec as unknown as JsonObject },
  allowedOrigin: "https://api.groq.com",
  securitySchemes: { api_key: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
