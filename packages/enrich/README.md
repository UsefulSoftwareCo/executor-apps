# Enrich

Enrich (enrich.so) is a B2B data enrichment API. This package covers email validation and finding, phone finder, reverse email lookup, personal email by LinkedIn URL, domain search, IP to company, Lead Finder (search, count, reveal, enrich, export, saved searches), people search, company followers, and wallet and team management, including the batch submit, progress and results endpoints.

## Interface

OpenAPI 3, assembled from the OpenAPI snippets embedded in every endpoint page of Enrich's official docs at [doc.enrich.so](https://doc.enrich.so) (the vendor publishes no single downloadable file, so the merged document is bundled as `spec.json`). Base URL `https://dev.enrich.so/api/v3`. 58 operations (the vendor lists about 59 pages; see Known gaps). Webhook callback pages are not tools.

## Auth

API key only. Create one in the Enrich dashboard at [dash.enrich.so](https://dash.enrich.so/dashboard/api-keys); keys start with `sk_` (the docs disagree on the exact prefix: `sk_live_` on endpoint pages, `sk_prod_` in an auth example). The key is sent in the `x-api-key` header. Enrich has no OAuth, so there is no redirect URI. The health check calls the read-only `GET /wallets/balance`.

## Known gaps

- Calls spend credits. All POST/DELETE operations ask for approval, as do the GETs the docs say charge or settle credits (phone lookup and the batch, bulk and follower results fetches, plus the export job status).
- "Continue company follower scrape" (POST /company-follower with a required `batchId` query) shares its method and path with the start-scrape operation, so the merged spec cannot represent it separately and it is not a tool.
- Company Followers endpoints are available to approved Enrich accounts only.
- The CSV download tools return raw CSV text.
