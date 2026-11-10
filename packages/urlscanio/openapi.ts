import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.urlscan.io/_bundle/apis/urlscan-openapi.yaml" },
  allowedOrigin: "https://urlscan.io",
  securitySchemes: { apikeyAuth: { type: "apiKey", in: "header", name: "api-key" } },
  methods: { apiKey: [{ scheme: "apikeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
