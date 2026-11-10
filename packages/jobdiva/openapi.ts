import type { OpenapiToolNamesOptions } from "apps/openapi";

// JobDiva serves its Swagger 2.0 documents without authentication; "Version 2" is the current API.
// "Version 1" is still published and holds about 175 operations (mostly /bi reports) that Version 2 lacks,
// so both are mounted.
// Every operation declares the `Authorization` header scheme. The sign-in token is not an account
// field, so index.ts replaces the header on each request; the binding below only lets the
// operations compile.
const common = {
  allowedOrigin: "https://api.jobdiva.com",
  baseUrl: "https://api.jobdiva.com",
  securitySchemes: { Authorization: { type: "apiKey", name: "Authorization", in: "header" } },
  methods: { apiUser: [{ scheme: "Authorization", field: "password", part: "value" as const, prefix: "" }] },
  oauth: [],
};

export const options = {
  ...common,
  source: { url: "https://api.jobdiva.com/swagger?group=Version%202" },
} satisfies OpenapiToolNamesOptions;

export const optionsV1 = {
  ...common,
  source: { url: "https://api.jobdiva.com/swagger?group=Version%201" },
} satisfies OpenapiToolNamesOptions;
