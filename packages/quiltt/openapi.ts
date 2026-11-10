import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.quiltt.io/latest/rest.yaml" },
  allowedOrigin: "https://api.quiltt.io",
  securitySchemes: {
    APISecretBearerAuth: { type: "http", scheme: "bearer" },
    SessionTokenBearerAuth: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "APISecretBearerAuth", field: "token", part: "value", prefix: "" }],
    profile: [{ scheme: "APISecretBearerAuth", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
