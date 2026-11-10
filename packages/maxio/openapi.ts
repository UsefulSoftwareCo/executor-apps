import type { OpenapiToolNamesOptions } from "apps/openapi";

// Every Maxio Advanced Billing site has its own host: https://<site>.chargify.com (US) or
// https://<site>.ebilling.maxio.com (EU). Anything else is rejected rather than normalized.
export const siteUrl = (site: string) => {
  const match =
    /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*)(\.chargify\.com|\.ebilling\.maxio\.com)?\/?$/.exec(site.trim().toLowerCase());
  if (match === null)
    throw new Error("Enter the site subdomain (acme), or the full host acme.chargify.com / acme.ebilling.maxio.com.");
  return `https://${match[1]}${match[2] ?? ".chargify.com"}`;
};

// The document declares HTTP basic auth (API key as username, password "x"); the provider's request
// template builds that header, so security is cleared here.
export const siteOptions = (site: string) =>
  ({
    source: { url: "https://developers.maxio.com/static/exports/maxio-advanced-billing-openapi3json.json" },
    allowedOrigin: siteUrl(site),
    baseUrl: siteUrl(site),
    securitySchemes: {},
    methods: {},
    oauth: [],
    patches: [
      { op: "add" as const, path: "/security", value: [] },
      // Event ingestion lives on events.chargify.com, which a global baseUrl would override, so drop it.
      { op: "remove" as const, path: "/paths/~1events~1{api_handle}.json" },
      { op: "remove" as const, path: "/paths/~1events~1{api_handle}~1bulk.json" },
      // Read-only GET declares BasicAuth at operation level, which has no mapped method; clear it.
      { op: "replace" as const, path: "/paths/~1subscription_groups~1{uid}~1prepayments.json/get/security", value: [] },
    ],
  }) satisfies OpenapiToolNamesOptions;

export const options = siteOptions("example");
