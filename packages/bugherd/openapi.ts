import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.bugherd.com/api/openapi.yaml" },
  allowedOrigin: "https://www.bugherd.com",
  baseUrl: "https://www.bugherd.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "token", part: "username", prefix: "" },
      // BugHerd docs: the API key is the Basic username and the password is the literal "x".
      // index.ts supplies this non-secret constant as a derived field.
      { scheme: "basicAuth", field: "basicPassword", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
