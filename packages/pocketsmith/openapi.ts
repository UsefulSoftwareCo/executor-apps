import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/pocketsmith/api/master/openapi.json" },
  allowedOrigin: "https://api.pocketsmith.com",
  securitySchemes: { developerKey: { type: "apiKey", in: "header", name: "X-Developer-Key" } },
  methods: { apiKey: [{ scheme: "developerKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
