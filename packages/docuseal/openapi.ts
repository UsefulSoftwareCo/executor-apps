import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://console.docuseal.com/openapi.yml" },
  allowedOrigin: "https://api.docuseal.com",
  baseUrl: "https://api.docuseal.com",
  securitySchemes: { AuthToken: { type: "apiKey", in: "header", name: "X-Auth-Token" } },
  methods: { apiKey: [{ scheme: "AuthToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
