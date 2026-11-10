import type { OpenapiToolNamesOptions } from "apps/openapi";

// The Demand API requires the token and the affiliate id on every call. The published document only
// declares the bearer token as a security scheme and lists X-Affiliate-Id as a required header
// parameter on all operations except /orders/modify, so each call would need it as tool input. These
// patches declare the affiliate id as a second apiKey scheme required together with the token and
// drop the per-operation header parameter, so the account's stored affiliate id is sent instead.
const withAffiliateParameter = [
    "/accommodations/search",
    "/accommodations/availability",
    "/accommodations/bulk-availability",
    "/accommodations/chains",
    "/accommodations/constants",
    "/accommodations/details",
    "/accommodations/details/changes",
    "/accommodations/reviews",
    "/accommodations/reviews/scores",
    "/common/languages",
    "/common/locations/airports",
    "/common/locations/cities",
    "/common/locations/countries",
    "/common/locations/districts",
    "/common/locations/landmarks",
    "/common/locations/regions",
    "/common/payments/cards",
    "/common/payments/currencies",
    "/orders/preview",
    "/orders/create",
    "/orders/details",
    "/orders/details/accommodations",
    "/orders/details/cars",
    "/orders/details/flights",
    "/orders/cancel",
    "/cars/search",
    "/cars/depots",
    "/cars/depots/reviews/scores",
    "/cars/details",
    "/cars/suppliers",
    "/cars/constants",
    "/messages/send",
    "/messages/conversations",
    "/messages/latest",
    "/messages/latest/confirm",
    "/messages/attachments/upload",
    "/messages/attachments/download",
    "/messages/attachments/metadata",
];

const patches = [
  { op: "add", path: "/components/securitySchemes/AffiliateId", value: { type: "apiKey", in: "header", name: "X-Affiliate-Id" } },
  { op: "replace", path: "/security", value: [{ BearerAuth: [], AffiliateId: [] }] },
  ...withAffiliateParameter.map((path) => ({
    op: "remove",
    path: `/paths/${path.replaceAll("/", "~1")}/post/parameters`,
  })),
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://developers.booking.com/_bundle/demand/docs/open-api/demand-api.json?download" },
  allowedOrigin: "https://demandapi.booking.com",
  securitySchemes: {
    BearerAuth: { type: "http", scheme: "bearer" },
    AffiliateId: { type: "apiKey", in: "header", name: "X-Affiliate-Id" },
  },
  methods: {
    apiKey: [
      { scheme: "BearerAuth", field: "token", part: "value", prefix: "" },
      { scheme: "AffiliateId", field: "affiliateId", part: "value", prefix: "" },
    ],
  },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
