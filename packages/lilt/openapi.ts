import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://support.lilt.com/api-reference/openapi-bundled.yaml" },
  allowedOrigin: "https://api.lilt.com",
  securitySchemes: { BasicAuth: { type: "http", scheme: "basic" } },
  // LILT takes the API key as both the Basic username and password.
  methods: {
    apiKey: [
      { scheme: "BasicAuth", field: "token", part: "username", prefix: "" },
      { scheme: "BasicAuth", field: "token", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
