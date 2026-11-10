import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Conta Azul product, six official OpenAPI documents published on developers.contaazul.com (one per API
// area), all served from https://api-v2.contaazul.com. index.ts mounts each under its own key.
const api = (path: string) =>
  ({
    source: { url: `https://developers.contaazul.com/_bundle/${path}.json?download` },
    allowedOrigin: "https://api-v2.contaazul.com",
    securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
    fallbackSecurity: [{ BearerAuth: [] }],
    methods: {
      oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const financialOptions = api("docs/financial-apis-openapi");
export const salesOptions = api("docs/sales-apis-openapi");
export const contractsOptions = api("docs/contracts-apis-openapi");
export const peopleOptions = api("open-api-docs/open-api-person");
export const productsOptions = api("open-api-docs/open-api-inventory");
export const invoicesOptions = api("open-api-docs/open-api-invoice");

// scripts/tools.ts reads `options`; the Financial API is the largest.
export const options = financialOptions;
