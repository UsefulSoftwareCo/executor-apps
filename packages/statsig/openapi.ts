import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.statsig.com/openapi/20240601.json" },
  allowedOrigin: "https://statsigapi.net",
  securitySchemes: { "STATSIG-API-KEY": { type: "apiKey", in: "header", name: "STATSIG-API-KEY" } },
  methods: { apiKey: [{ scheme: "STATSIG-API-KEY", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
