import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developer.junglescout.com/api-docs/v1/swagger.json" },
  allowedOrigin: "https://developer.junglescout.com",
  securitySchemes: {
    authorization_header: { type: "apiKey", name: "Authorization", in: "header" },
  },
  methods: { apiKey: [{ scheme: "authorization_header", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
