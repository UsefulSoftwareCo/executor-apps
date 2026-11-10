import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// document.json is the official API 2026-07 reference, merged from the per-operation OpenAPI
// definitions published at https://x-series-api.lightspeedhq.com/reference (the docs site has no
// single downloadable file). Its server variable is removed: the store host is set per account.

// Every retailer lives on its own host: https://<domain_prefix>.retail.lightspeed.app.
export const siteUrl = (input: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9]|[a-z0-9])(?:\.retail\.lightspeed\.app)?\/?$/.exec(
    input.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <domain_prefix> of <domain_prefix>.retail.lightspeed.app (letters, digits, hyphens).");
  return `https://${match[1]}.retail.lightspeed.app`;
};

export const lightspeedOptions = (domainPrefix: string) =>
  ({
    source: { document: document as never },
    allowedOrigin: siteUrl(domainPrefix),
    baseUrl: `${siteUrl(domainPrefix)}/api/2026-07`,
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    methods: { token: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const options = lightspeedOptions("example");
