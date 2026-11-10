# Leadfeeder

Leadfeeder (Dealfront) identifies companies visiting your website. This package exposes the public API's 85 operations as tools: accounts, website visits and custom feeds, companies, contacts, lists, tags, campaigns, custom fields, buyer personas, ICPs, IP enrichment, CRM records, usage, users and workflows. 35 are writes that need approval; the 10 POST operations that only query data (searches, matches, estimates, membership lookups) run without approval. With OAuth, some operations are unavailable; see Known gaps.

**Interface:** OpenAPI, the vendor's official document at https://api.leadfeeder.com/openapi.yaml (docs: https://docs.leadfeeder.com/api/public). The legacy `Authorization: Token token=` API is not covered; Leadfeeder no longer issues tokens for it.

**Auth**
- API key: sent as `X-Api-Key`. Create it under Settings > Personal > API keys in Leadfeeder. API keys are not subject to OAuth scope checks, so every tool works with a key.
- OAuth: authorization code with PKCE, client credentials in the request body. Someone with the Applications Management permission registers an app under Settings > Company > Developer Access > Applications, which yields a client ID and secret. Register Executor's OAuth callback URL as the app's redirect URI; Executor's connect page for Leadfeeder displays that exact URL. Leadfeeder's OAuth apps are currently Internal only (Public apps are "coming soon"), so only users inside the company that registered the app can authorize it.
- Requested scopes: all read scopes, plus `buyer_personas:write`, `campaigns:write`, `companies:write`, `contacts:write`, `icps:write`, `lists:write`, `tags:write` and `web_visits:write`. Admin scopes (`accounts:write`, `users:write`, `custom_fields:write`, `workflows:write`) are not requested.

**Icon:** the official Leadfeeder app icon from https://www.leadfeeder.com/favicon.svg, with the mark recolored from #1D1D1B to #4A4A44 on purpose. The icon builder turns near-black marks white in the dark variant, which would be unreadable on the vendor's light green tile; the recolored mark stays visible on both light and dark backgrounds.

**Known gaps:** the vendor describes the spec as work in progress, so some endpoints may not be implemented yet. Most endpoints take an `account_id` query parameter; list accounts first.
- Under OAuth, 7 tools will return 403 "OAuth scope insufficient" because their scopes are not requested: `custom_fields:write` (create, update and delete custom fields, and `PATCH /v1/companies/{id}` and `PATCH /v1/contacts/{id}`, which also require it, 5 tools); `accounts:write` (`PATCH /v1/settings/cookie-consent` and `/v1/settings/data-processing`, 2 tools). No exposed tool needs `users:write` or `workflows:write`. Use an API key for these 7.
