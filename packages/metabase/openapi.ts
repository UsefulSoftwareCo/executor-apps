import type { OpenapiToolNamesOptions } from "apps/openapi";

// Metabase is self-hosted or runs on Metabase Cloud, so every account has its own origin. Each
// instance serves its own OpenAPI 3.1 document at /api/docs/openapi.json (Metabase 0.55+).
export const siteUrl = (url: string) => {
  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`);
  } catch {
    throw new Error("Enter your Metabase URL, for example https://acme.metabaseapp.com.");
  }
  if (parsed.protocol !== "https:")
    throw new Error("The Metabase URL must use https:// so the API key is not sent in plaintext.");
  if (parsed.search !== "" || parsed.hash !== "" || parsed.username !== "" || parsed.password !== "")
    throw new Error("Enter only the Metabase base URL, without credentials, query or fragment.");
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
};

export const metabaseOptions = (url: string) =>
  ({
    source: { url: `${siteUrl(url)}/api/docs/openapi.json` },
    allowedOrigin: new URL(siteUrl(url)).origin,
    baseUrl: siteUrl(url),
    securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
    methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

// Metabase's own public instance serves the same document, so compile checks need no account.
export const options = metabaseOptions("https://stats.metabase.com");
