import type { OpenapiToolNamesOptions } from "apps/openapi";

// Wise's description lists UserToken, PersonalToken and ClientCredentialsToken, all HTTP bearer.
// A personal API token is sent as a bearer token on every operation, so bind it to all three.
export const options = {
  source: { url: "https://docs.wise.com/_bundle/api-reference/@latest/index.json?download" },
  allowedOrigin: "https://api.wise.com",
  securitySchemes: {
    UserToken: { type: "http", scheme: "bearer" },
    PersonalToken: { type: "http", scheme: "bearer" },
    ClientCredentialsToken: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [
      { scheme: "UserToken", field: "token", part: "value", prefix: "" },
      { scheme: "PersonalToken", field: "token", part: "value", prefix: "" },
      { scheme: "ClientCredentialsToken", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
