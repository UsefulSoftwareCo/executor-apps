import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.lumos.com/openapi.json" },
  allowedOrigin: "https://api.lumos.com",
  securitySchemes: { HTTPBearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "HTTPBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
