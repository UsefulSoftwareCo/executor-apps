import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://reference.flatfile.com/openapi.json" },
  allowedOrigin: "https://api.x.flatfile.com",
  securitySchemes: { default: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "default", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
