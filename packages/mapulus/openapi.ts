import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.mapulus.com/v1/openapi.json" },
  allowedOrigin: "https://api.mapulus.com",
  securitySchemes: { HTTPBearer: { type: "http", scheme: "bearer" }, bearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [
      { scheme: "HTTPBearer", field: "token", part: "value", prefix: "" },
      { scheme: "bearerAuth", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
