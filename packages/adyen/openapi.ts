import type { OpenapiToolNamesOptions } from "apps/openapi";

// Adyen's official OpenAPI documents, https://github.com/Adyen/adyen-openapi/tree/main/yaml. Adyen splits its
// API into one document per service, each on its own host; index.ts mounts each under its own key and swaps in
// the origin for the account's environment. The test origins below are only used to compile.
const spec = (name: string) => ({
  url: `https://raw.githubusercontent.com/Adyen/adyen-openapi/main/yaml/${name}.yaml`,
});

const credentials = {
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} as const;

// POST operations that only read or dry-run are kinds=query, so they run without an approval prompt.
const api = <const K extends Record<string, "query">>(name: string, origin: string, kinds: K) =>
  ({ source: spec(name), allowedOrigin: new URL(origin).origin, baseUrl: origin, ...credentials, kinds }) satisfies OpenapiToolNamesOptions;

export const checkoutOptions = api("CheckoutService-v72", "https://checkout-test.adyen.com/v72", {
  "post-paymentMethods": "query",
  "post-cardDetails": "query",
  "post-paymentMethods-balance": "query",
});
export const managementOptions = api("ManagementService-v3", "https://management-test.adyen.com/v3", {});
export const balancePlatformOptions = api("BalancePlatformService-v2", "https://balanceplatform-api-test.adyen.com/bcl/v2", {});
export const legalEntityOptions = api("LegalEntityService-v4", "https://kyc-test.adyen.com/lem/v4", {});
export const transfersOptions = api("TransferService-v4", "https://balanceplatform-api-test.adyen.com/btl/v4", {});
export const dataProtectionOptions = api("DataProtectionService-v1", "https://ca-test.adyen.com/ca/services/DataProtectionService/v1", {});

// scripts/tools.ts reads `options`; the Management API is the largest.
export const options = managementOptions;
