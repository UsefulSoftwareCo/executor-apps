import type { OpenapiToolNamesOptions } from "apps/openapi";

// Mailercloud's official Mintlify-hosted documents. The Marketing API and Email API take the raw API key in the
// Authorization header (no Bearer prefix).
const credentials = {
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

// Many Marketing API list/search/report calls are POSTs that only read, so they run without an approval prompt.
export const marketingOptions = {
  source: { url: "https://apidoc.mailercloud.com/openapi-v1.json" },
  allowedOrigin: "https://cloudapi.mailercloud.com",
  baseUrl: "https://cloudapi.mailercloud.com/v1",
  ...credentials,
  kinds: {
    "get-statistics-for-the-top-performing-email-domains-in-a-campaign": "query",
    "campaign-list": "query",
    "testmail-group-list": "query",
    "list-campaign-opens": "query",
    "list-campaign-clicks": "query",
    "list-campaign-unsubscribes": "query",
    "list-property": "query",
    "get-contacts-in-a-list": "query",
    "get-all-list-and-search-list": "query",
    "list-segment": "query",
    "get-all-senders-and-search-senders": "query",
    "get-all-reply-emails-and-search-reply-emails": "query",
    "webform-list": "query",
    "list-tags": "query",
    "search-and-list-webhooks": "query",
    "list-templates": "query",
    "get-single-automatoin-details": "query",
    "inbox-tracking": "query",
  },
} satisfies OpenapiToolNamesOptions;

export const emailOptions = {
  source: { url: "https://apidoc.mailercloud.com/openapi-emailapi.json" },
  allowedOrigin: "https://email-api.mailercloud.com",
  baseUrl: "https://email-api.mailercloud.com",
  ...credentials,
  kinds: {
    "list-email-api-inbox-tracking-campaigns": "query",
    "search-suppressions": "query",
  },
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads `options`; the Marketing API is the main one.
export const options = marketingOptions;
