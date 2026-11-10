import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developers.pave.com/_bundle/apis/index.json?download" },
  allowedOrigin: "https://api.pave.com",
  securitySchemes: { "api-key": { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "api-key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
