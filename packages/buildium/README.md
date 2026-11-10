# Buildium

Property management with Buildium: rental properties and units, leases, tenants, rental and association owners, associations, vendors, work orders and tasks, bank accounts, general ledger and bills, applicants, files and webhooks. 462 tools, 224 of them mutations (each requires approval).

Interface: OpenAPI 3 from Buildium's developer portal, https://developer.buildium.com/. The portal renders its own definition with Redoc and publishes no download URL, so `document.json` is that definition extracted unchanged from the page. It declares no security schemes; `openapi.ts` declares the two API key headers and applies them to every operation. Refresh `document.json` from the portal when Buildium adds endpoints.

Auth: API key only. Buildium's Open API needs a Premium subscription. An administrator with access to Application settings enables the API under Settings > Developer tools > API settings, then creates a key under API keys. The connect form asks for the key's Client ID and Client secret, sent as the `x-buildium-client-id` and `x-buildium-client-secret` headers to `api.buildium.com`. Buildium offers OAuth only to partner integrations, so no OAuth method is provided.

Known gaps: none known; all operations compiled. Rate limits apply per Buildium's published limits.
