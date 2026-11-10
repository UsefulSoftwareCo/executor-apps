import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.opensea.io/api/v2/openapi.json" },
  allowedOrigin: "https://api.opensea.io",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  // POST operations that only read (batch lookups, receipt, validation) do not need approval.
  kinds: {
    "get_transaction_receipt": "query",
    "get_tokens_batch": "query",
    "get_nfts_batch": "query",
    "get_collections_batch": "query",
    "validate_nft_metadata": "query",
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
