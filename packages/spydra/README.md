# Spydra

Manage a Spydra OpenRWA public-chain token store: assets, tokens, token sales, investors, investments, payouts, KYC, countries and supported chains (40 tools, 14 of them mutations, which require approval).

**Interface:** OpenAPI. Spydra's own OpenRWA API definition (`https://api.openrwa.io/api/v/1`), attached to the Token Store (Public Chain) pages at https://docs.spydra.app/developers/api-reference/token-store-public-chain. Spydra publishes no definition at a stable path; the package uses the GitBook-hosted file `rwa-swagger (Updated-final).yaml` linked from the Token Issuer page, via a tokenised (firebase token query string) URL that may expire or rotate; if it does, update `source.url` in `openapi.ts`. The Investor page links a second file, `rwa-swagger (3).yaml`, with the same 40 operations and security schemes, but its servers also include `http://localhost:5004/api/v/1` and `https://rwa-controlplane.spdr.club/api/v/1` besides `api.openrwa.io`. Only `api.openrwa.io` is allowed here.

**Auth:** API key (`apiKey`) with two fields, API key and store ID. The API definition lists `x-api-key`, `x-store-id` and `x-timezone` as alternative security schemes per operation. The package binds `x-api-key` through the framework and always sends `x-store-id` too; whether the store ID is required alongside the key is unverified, and sending it is harmless. Spydra's docs do not document how a public-chain token-store API key or store ID is obtained: the only API key page (https://docs.spydra.app/developers/api-key) describes per-Network keys (Networks > API Keys) for the REST API and GraphQL, and the create-a-token-store guide mentions neither. Ask Spydra or check your token store account for these values. There is no OAuth.

**Known gaps:**
- How to obtain the token-store API key and store ID is not in Spydra's public docs; the header names come from the API definition.
- Per-request `x-investor-id`, `x-test-mode` and `x-timezone` headers appear in the definition for investor-scoped calls; set them where the tool exposes them, otherwise the store-level behaviour applies.
- Not verified against a live account.
