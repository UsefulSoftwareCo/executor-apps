import type { OpenapiToolNamesOptions } from "apps/openapi";

// The spec publishes no operationIds, so `kinds` is keyed by generated tool name. NMKR
// implements many state-changing operations (mint, delete, reserve an address) as plain GETs,
// which would otherwise be classified as queries and run without approval.
const mutatingGets = [
  "customer.getAddPayoutWallet",
  "nft.getBlockUnblockNft",
  "addressReservationSale.getCancelAddressReservation",
  "projects.getCreateBurningAddress",
  "nft.getDeleteAllNftsFromProject",
  "auctions.getDeleteAuction",
  "nft.getDeleteNft",
  "projects.getDeleteProject",
  "mint.getMintAndSendRandom",
  "mint.getMintAndSendSpecific",
  "mint.getMintRoyaltyToken",
  "mint.getRemintAndBurn",
  // Reserve a payment address for a sale.
  "addressReservationSale.v2.getGetPaymentAddressForRandomNftSaleByPrice",
  "addressReservationSale.v2.getGetPaymentAddressForRandomNftSale",
  "addressReservationSale.v2.getGetPaymentAddressForSpecificNftSaleByPrice",
  "addressReservationSale.v2.getGetPaymentAddressForSpecificNftSale",
  // Creates a wallet validation request.
  "walletValidation.v2.getGetWalletValidationAddressByValidationname",
  "walletValidation.v2.getGetWalletValidationAddress",
] as const;

const kinds: Record<string, "mutation"> = Object.fromEntries(
  mutatingGets.map((name) => [name, "mutation" as const]),
);

export const options = {
  source: { url: "https://studio-api.nmkr.io/swagger/v2/swagger.json" },
  allowedOrigin: "https://studio-api.nmkr.io",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds,
} satisfies OpenapiToolNamesOptions;
