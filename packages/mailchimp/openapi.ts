import type { JsonValue } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// Mailchimp's official Swagger 2.0 description of the Marketing API (mailchimp/mailchimp-client-lib-codegen).
// Its host is the placeholder server.api.mailchimp.com; every account lives on one data center,
// <dc>.api.mailchimp.com, which index.ts swaps in.
const source = {
  url: "https://raw.githubusercontent.com/mailchimp/mailchimp-client-lib-codegen/main/spec/marketing.json",
};

export const apiOrigin = (dc: string) => {
  if (!/^[a-z]+[0-9]+$/.test(dc)) throw new Error("Mailchimp server prefix must look like us6 (the part after the dash in the API key).");
  return `https://${dc}.api.mailchimp.com`;
};

// API key accounts use HTTP Basic auth: any username, the API key as the password.
export const tokenOptions = (dc: string) =>
  ({
    source,
    allowedOrigin: apiOrigin(dc),
    baseUrl: `${apiOrigin(dc)}/3.0`,
    securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
    methods: {
      apiKey: [
        { scheme: "basicAuth", field: "dc", part: "username", prefix: "" },
        { scheme: "basicAuth", field: "apiKey", part: "password", prefix: "" },
      ],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

// OAuth access tokens are sent as a Bearer token; the document only declares Basic, so the
// global requirement is rewritten to the bearer scheme.
const bearerPatches: readonly { op: "replace"; path: string; value: JsonValue }[] = [
  { op: "replace", path: "/security", value: [{ bearerAuth: [] }] },
];

export const oauthOptions = (dc: string) =>
  ({
    source,
    allowedOrigin: apiOrigin(dc),
    baseUrl: `${apiOrigin(dc)}/3.0`,
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    patches: bearerPatches,
    methods: {
      oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const options = tokenOptions("us1");
