# Wiza

Find and enrich B2B contacts and companies with Wiza: single-contact reveals (email, phone, profile), company enrichment, prospect and company search, bulk enrichment lists, prospect lists, credit balance and filter autocomplete (locations, technologies). 13 tools.

## Interface

OpenAPI, compiled from Wiza's official document at https://docs.wiza.co/swagger/v1/openapi.yaml (also linked from the docs index at https://docs.wiza.co/llms.txt). The document is public, but Cloudflare answers requests without a browser User-Agent with a 403 challenge (plain curl fails), so a converted JSON copy is embedded in `document.json` instead of being fetched at runtime. Refresh it by downloading the YAML with a browser User-Agent and converting it to JSON. All 13 operations become tools, with typed request schemas from the spec. Wiza offers no MCP server or GraphQL API.

## Auth

API key only (Wiza has no OAuth). Create one in Wiza under Settings, API (https://docs.wiza.co/account-access/generate-api-key). It is sent as `Authorization: Bearer <key>`. The health check calls `GET /meta/credits`.

## Notes

- Reveals, lists, searches that return profiles or companies, and company enrichment spend API credits, so all POST tools ask for approval. Autocomplete, credits, and the get/list-contacts tools are read-only.
- Rate limits: 30 requests per minute for company enrichment (see Wiza's usage limits).
- Known gaps: CSV export of list contacts (`.csv` path suffix) is not in the spec and is not exposed; webhooks are configured through `callbackUrl`. Tool names come from the spec paths (no operationIds are published).
