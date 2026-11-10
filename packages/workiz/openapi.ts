import type { OpenapiToolNamesOptions } from "apps/openapi";

// Workiz's official v1 Swagger UI loads https://developer.workiz.com/api.json. Its server is
// https://api.workiz.com/api/v1/{api_token}: the account's API token is a path segment, and the
// document declares no security scheme. pathPrefix turns it into a path parameter that index.ts
// fills from the account. The API secret travels as `auth_secret` in POST bodies; index.ts adds
// it, and the patch below stops the payment body from demanding it of the caller.
export const options = {
  source: { url: "https://developer.workiz.com/api.json" },
  allowedOrigin: "https://api.workiz.com",
  baseUrl: "https://api.workiz.com/api/v1",
  pathPrefix: "/{api_token}",
  securitySchemes: {},
  methods: { apiKey: [] },
  oauth: [],
  patches: [
    { op: "replace", path: "/components/schemas/addPaymentBody/required", value: ["amount", "type", "date"] },
  ],
} satisfies OpenapiToolNamesOptions;
