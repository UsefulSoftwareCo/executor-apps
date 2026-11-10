import type { OpenapiToolNamesOptions } from "apps/openapi";

// Mailgun is hosted per region (US api.mailgun.net, EU api.eu.mailgun.net); index.ts swaps in the account's origin.
export const placeholderOrigin = "https://api.mailgun.net";

const base = "https://documentation.mailgun.com/_bundle/docs";

// Mailgun publishes four official OpenAPI 3.1 documents (the "Download OpenAPI description" links in its docs):
// Send, Validate, Inspect and Optimize. All use the same US/EU hosts and HTTP Basic auth.
const common = {
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  fallbackSecurity: [{ basicAuth: [] }],
  // HTTP Basic with the fixed username "api"; index.ts supplies it as the `user` field.
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "user", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "token", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} as const;

export const sendOptions = {
  ...common,
  source: { url: `${base}/mailgun/api-reference/send/mailgun.json?download` },
} satisfies OpenapiToolNamesOptions;

export const validateOptions = {
  ...common,
  source: { url: `${base}/validate/oas/openapi-validate-final.json?download` },
} satisfies OpenapiToolNamesOptions;

export const inspectOptions = {
  ...common,
  source: { url: `${base}/inspect/api-reference/openapi-final.json?download` },
} satisfies OpenapiToolNamesOptions;

export const optimizeOptions = {
  ...common,
  source: { url: `${base}/inboxready/api-reference/optimize/inboxready.json?download` },
} satisfies OpenapiToolNamesOptions;

export const options = sendOptions;
