import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developers.beehiiv.com/openapi/api-reference.json" },
  allowedOrigin: "https://api.beehiiv.com",
  securitySchemes: { BearerAuthScheme: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "BearerAuthScheme", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "BearerAuthScheme", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
