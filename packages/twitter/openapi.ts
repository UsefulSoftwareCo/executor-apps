import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.x.com/2/openapi.json" },
  allowedOrigin: "https://api.x.com",
  securitySchemes: {
    BearerToken: { type: "http", scheme: "bearer" },
    OAuth2UserToken: { type: "http", scheme: "bearer" },
  },
  fallbackSecurity: [{ BearerToken: [] }],
  methods: {
    bearerToken: [{ scheme: "BearerToken", field: "token", part: "value", prefix: "" }],
    oauth: [
      { scheme: "OAuth2UserToken", field: "access_token", part: "value", prefix: "" },
      { scheme: "BearerToken", field: "access_token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
