import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://rootly-heroku.s3.amazonaws.com/swagger/v1/swagger.json" },
  allowedOrigin: "https://api.rootly.com",
  securitySchemes: { bearer_auth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer_auth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer_auth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
