import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.calendarhero.com/swagger.json" },
  allowedOrigin: "https://api.calendarhero.com",
  securitySchemes: {
    token: { type: "apiKey", name: "Authorization", in: "header" },
  },
  methods: { apiKey: [{ scheme: "token", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
