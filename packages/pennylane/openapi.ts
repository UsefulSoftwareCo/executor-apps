import type { OpenapiToolNamesOptions } from "apps/openapi";

// Pennylane's Company API v2 document, published by its docs host. It declares only an OAuth
// scheme (partner-only), so the company API token is declared as a bearer scheme under the same name.
export const options = {
  source: { url: "https://pennylane.readme.io/openapi/accounting.json" },
  allowedOrigin: "https://app.pennylane.com",
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
  methods: {
    apiToken: [{ scheme: "oauth2", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
