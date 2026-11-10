import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://help.descript.com/developers/openapi.json" },
  allowedOrigin: "https://descriptapi.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { token: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
