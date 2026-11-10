# SAP Ariba

Access to SAP Ariba's open APIs (procurement, sourcing, analytical/operational reporting, supplier data, and the other APIs in the SAP Business Accelerator Hub's Ariba packages) for one realm, through Ariba's OAuth 2LO API gateway.

**Interface:** custom. SAP publishes Ariba's OpenAPI documents only through the login-gated Business Accelerator Hub (api.sap.com), and each API is a separate versioned spec on the shared gateway `https://open{subdomain}.ariba.com/api/<api-name>/v<n>/prod/...`, so nothing can be compiled ahead of time. The package exposes five generic tools (`get`, `post`, `put`, `patch`, `delete`) that take a gateway path and query parameters (include `realm`). All writes require approval. No named per-endpoint tools are provided because endpoint paths could not be verified from public sources; the tools were not exercised against a live realm.

**Auth:** one method, application credentials (OAuth 2.0 two-legged, `grant_type=openapi_2lo`). Create an application in the SAP Ariba Developer Portal (developer.ariba.com), request API access for the APIs you need, and obtain approval. You supply:
- Region: the API subdomain of your data center, one of `api` (US), `api-eu`, or `api.au.cloud`. The token endpoint is `https://{region}.ariba.com/v2/oauth/token` and resources are served from `https://open{region}.ariba.com`.
- Client ID and client secret (OAuth credentials of the application, sent as HTTP Basic to the token endpoint).
- Application key (API key), sent as the `apiKey` header on every call.
- Ariba Network ID (ANID, `AN...`), sent as `x-ariba-network-id`.

There is no browser OAuth flow, so no redirect URI is needed. The access token is requested once per session and not persisted.

**Known gaps:** no named tools per API; regions other than the three above (for example other sovereign clouds) are rejected until added. The health check only verifies that a token can be issued: it does not call the gateway, so the application key, ANID and the `open{region}` host are not validated until the first tool call. No read-only gateway endpoint that works for every application could be confirmed from public sources (each API is separately entitled), and a guessed path would report healthy accounts as broken.

**Evidence:** auth details (token URL `https://{subdomain}.ariba.com/v2/oauth/token`, `grant_type=openapi_2lo`, Basic client credentials, `apikey` and `x-ariba-network-id` headers, subdomains `api`, `api-eu`, `api.au.cloud`, gateway `https://open{subdomain}.ariba.com`) come from an existing provider record and its connect guide, which cite the Ariba Developer Portal for the application key, ANID and client credentials. SAP's own docs (developer.ariba.com, help.sap.com) render client-side and could not be fetched, and web search was unavailable, so they were not independently confirmed. HTTP header names are case-insensitive, so `apiKey` and `apikey` are equivalent. Per-API OpenAPI documents live only behind the login-gated SAP Business Accelerator Hub (api.sap.com redirects to SAP login); no public spec on GitHub was found.

**Icon:** the official SAP Ariba Procurement app icon (published by SAP SE on the App Store), downscaled to 256px. SAP's corporate logo is not used. No standalone Ariba SVG mark is published (ariba.com redirects to sap.com and Wikipedia/Wikidata carry only the SAP logo); a brand-portal SVG would be preferable if available.
