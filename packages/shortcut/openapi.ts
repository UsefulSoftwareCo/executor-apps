import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.shortcut.com/api/rest/v3/shortcut.swagger.json" },
  allowedOrigin: "https://api.app.shortcut.com",
  securitySchemes: {
    api_token: { type: "apiKey", name: "Shortcut-Token", in: "header" },
  },
  methods: { apiKey: [{ scheme: "api_token", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
