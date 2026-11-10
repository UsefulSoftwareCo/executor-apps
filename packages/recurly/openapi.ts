import type { OpenapiToolNamesOptions } from "apps/openapi";

// Recurly's V3 API definition lives in its official client repositories (recurly-client-node).
// Pinned to the 4.82.0 release tag so the generated tool set only changes with this file.
// PurchaseCreate points at '#/components/schemas/Transaction/properties/initiator', a ref form the
// compiler rejects (it drops the four Purchases operations), so point it at the enum schema itself.
const transactionOptions = [
  {
    type: "object",
    properties: {
      initiator: { $ref: "#/components/schemas/TransactionInitiatorEnum" },
      merchant_reason_code: { $ref: "#/components/schemas/TransactionMerchantReasonCodeEnum" },
      skip_gateway_fraud: { type: "boolean", title: "Skip Gateway Fraud", description: "When true, instructs the payment gateway to skip fraud checks for this transaction. Not all gateways support this." },
      skip_recurly_fraud: { type: "boolean", title: "Skip Recurly Fraud", description: "When true, skips Recurly's fraud detection checks. Does not affect gateway-level fraud checks." },
      skip_all_fraud: { type: "boolean", title: "Skip All Fraud", description: "When true, skips all fraud checks for this transaction." },
      descriptor_suffix: { type: "string", title: "Transaction Descriptor Suffix", maxLength: 255, description: "Optionally overrides the suffix component of the composed transaction descriptor." },
    },
  },
];

// The schema is replaced whole because patches cannot address array items (allOf/0).
const patches = [
  { op: "replace", path: "/components/schemas/PurchaseCreate/properties/transaction/allOf", value: transactionOptions },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

const common = {
  source: { url: "https://raw.githubusercontent.com/recurly/recurly-client-node/4.82.0/openapi/api.yaml" },
  patches,
  securitySchemes: { api_key: { type: "http", scheme: "basic" } },
  oauth: [],
} as const;

// The private API key is the Basic username; the password stays empty.
export const options = {
  ...common,
  allowedOrigin: "https://v3.recurly.com",
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "username", prefix: "" }] },
} satisfies OpenapiToolNamesOptions;

export const euOptions = {
  ...common,
  allowedOrigin: "https://v3.eu.recurly.com",
  methods: { apiKeyEu: [{ scheme: "api_key", field: "token", part: "username", prefix: "" }] },
} satisfies OpenapiToolNamesOptions;
