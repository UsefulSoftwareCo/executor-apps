import type { OpenapiToolNamesOptions } from "apps/openapi";

// Personal access tokens go in X-Figma-Token; OAuth access tokens are sent as a bearer
// Authorization header (the spec models both as security schemes).
export const options = {
  source: { url: "https://raw.githubusercontent.com/figma/rest-api-spec/main/openapi/openapi.yaml" },
  allowedOrigin: "https://api.figma.com",
  securitySchemes: {
    PersonalAccessToken: { type: "apiKey", name: "X-Figma-Token", in: "header" },
    OAuthBearer: { type: "apiKey", name: "Authorization", in: "header" },
  },
  fallbackSecurity: [{ PersonalAccessToken: [] }],
  methods: {
    token: [{ scheme: "PersonalAccessToken", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "OAuthBearer", field: "access_token", part: "value", prefix: "Bearer " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
