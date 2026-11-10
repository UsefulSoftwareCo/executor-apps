import type { OpenapiToolNamesOptions } from "apps/openapi";
import communityDocument from "./community.json" with { type: "json" };

// Gainsight Customer Communities publishes five official OpenAPI 3.0 documents on every region's API host
// (https://api2-<region>.insided.com/docs/ renders them). The documents are identical across regions and
// need no credentials; index.ts swaps in the account's own regional origin. The placeholder origin below is
// only used to compile.
export const placeholderOrigin = "https://api2-us-west-2.insided.com";

const api = (file: string, source: OpenapiToolNamesOptions["source"] = { url: `${placeholderOrigin}/${file}/swagger.json` }) =>
  ({
    source,
    allowedOrigin: placeholderOrigin,
    baseUrl: placeholderOrigin,
    // The single oauth2 scheme (client credentials). The bearer token is minted from the account's client id
    // and secret in index.ts, because the token endpoint is on the account's regional host.
    securitySchemes: { insided_auth: { type: "http", scheme: "bearer" } },
    methods: {
      clientCredentials: [{ scheme: "insided_auth", field: "clientSecret", part: "value", prefix: "" }],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

// The Community API document (community.json) is v2/swagger.json unchanged except that the empty arrays `[]`
// it publishes where objects are required (the RemoveCategoryRequest schema and the media types of the
// markAsNotSpam request bodies) are `{}`: the generator rejects the arrays.
export const apis = {
  community: api("v2", { document: communityDocument as never }),
  user: api("api1"),
  events: api("events"),
  search: api("search"),
  gamification: api("gamification"),
} as const;

// Path prefix of each document's servers entry, keyed by its options.
export const prefixes = new Map<object, string>([
  [apis.community, "/v2"],
  [apis.events, "/v2"],
]);

// scripts/tools.ts reads `options`; the Community API is the main one.
export const options = apis.community;
