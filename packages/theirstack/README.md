# TheirStack

Job postings, company and technographic data: search jobs and companies, look up the technologies a company uses, buying intents, company lists, saved searches, webhooks, catalog lookups, credit balance and API usage.

Interface: OpenAPI, the vendor's official document at https://api.theirstack.com/openapi.json (server https://api.theirstack.com).

Auth: API key only. Create one in the TheirStack app at https://app.theirstack.com/settings/api-key (Settings > API Keys > Create API key); it is sent as a Bearer token. TheirStack offers no user-created OAuth apps.

Health check: `GET /v0/billing/credit-balance`.

Known gaps: most data endpoints consume TheirStack credits; mutations (list, saved search, webhook and unsubscribe changes) require approval. The icon is the official apple-touch-icon PNG (180px) as TheirStack publishes no SVG mark.
