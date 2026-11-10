import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/pinterest/api-description/main/v5/openapi.yaml" },
  allowedOrigin: "https://api.pinterest.com",
  baseUrl: "https://api.pinterest.com/v5",
  securitySchemes: {
    pinterest_oauth2: { type: "http", scheme: "bearer" },
    conversion_token: { type: "http", scheme: "bearer" },
  },
  methods: {
    token: [
      { scheme: "pinterest_oauth2", field: "token", part: "value", prefix: "" },
      { scheme: "conversion_token", field: "token", part: "value", prefix: "" },
    ],
    oauth: [{ scheme: "pinterest_oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
