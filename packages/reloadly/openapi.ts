import type { OpenapiToolNamesOptions } from "apps/openapi";

// Reloadly's three official API documents, published by docs.reloadly.com. Each document lists production and
// sandbox servers per path; index.ts pins the origin for the account's environment. The placeholder origins here
// are the production ones. Every document also describes POST /oauth/token on auth.reloadly.com; that path is
// removed by a patch because it would post to the product host, and index.ts exchanges the client credentials itself.
const api = (name: string, origin: string) =>
  ({
    source: { url: `https://docs.reloadly.com/assets/api/${name}.json` },
    allowedOrigin: origin,
    baseUrl: origin,
    // The bearer token is minted per product in index.ts; the clientId field is only a placeholder the fetch wrapper replaces.
    securitySchemes: { BearerToken: { type: "http", scheme: "bearer" } },
    methods: { credentials: [{ scheme: "BearerToken", field: "clientId", part: "value", prefix: "" }] },
    oauth: [],
    patches: [{ op: "remove", path: "/paths/~1oauth~1token" }],
  }) satisfies OpenapiToolNamesOptions;

export const giftcardsOptions = api("gift-cards", "https://giftcards.reloadly.com");
export const airtimeOptions = api("airtime", "https://topups.reloadly.com");
export const utilitiesOptions = api("utility-payments", "https://utilities.reloadly.com");

export const options = giftcardsOptions;
