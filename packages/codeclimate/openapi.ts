import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.qlty.sh/openapi.json" },
  allowedOrigin: "https://api.qlty.sh",
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
