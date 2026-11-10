import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: {
    url: "https://raw.githubusercontent.com/PandaDoc/pandadoc-openapi-specification/main/openapi.json",
  },
  allowedOrigin: "https://api.pandadoc.com",
  securitySchemes: {
    apiKey: { type: "apiKey", name: "Authorization", in: "header" },
    oauth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "API-Key " }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
