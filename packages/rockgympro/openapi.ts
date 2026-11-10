import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.rockgympro.com/openapi.yaml" },
  baseUrl: "https://api.rockgympro.com",
  allowedOrigin: "https://api.rockgympro.com",
  securitySchemes: { https: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "https", field: "username", part: "username", prefix: "" },
      { scheme: "https", field: "password", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
