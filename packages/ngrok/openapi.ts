import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/ngrok/ngrok-openapi/main/ngrok.json" },
  allowedOrigin: "https://api.ngrok.com",
  securitySchemes: { authentication: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "authentication", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
