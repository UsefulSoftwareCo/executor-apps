import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: {
    url: "https://raw.githubusercontent.com/frontapp/front-api-specs/main/core-api/core-api.json",
  },
  allowedOrigin: "https://api2.frontapp.com",
  securitySchemes: { http: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "http", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "http", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
