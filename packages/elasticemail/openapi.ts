import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.elasticemail.com/public/v4/swagger" },
  allowedOrigin: "https://api.elasticemail.com",
  securitySchemes: {
    apikey: { type: "apiKey", name: "X-ElasticEmail-ApiKey", in: "header" },
  },
  methods: { apiKey: [{ scheme: "apikey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
