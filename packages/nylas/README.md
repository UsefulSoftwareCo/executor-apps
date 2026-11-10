# Nylas

Email, calendar, contacts, Notetaker, Scheduler, connectors, webhooks and administration through the Nylas v3 API. This package covers the catalog target "Nylas MCP": the REST API is far broader (204 generated tools) than the hosted MCP server's 38 tools, which is why no MCP mount is added.

**Interface:** OpenAPI 3.1, Nylas's official document at https://developer.nylas.com/openapi.yaml, called live against `https://api.us.nylas.com` or `https://api.eu.nylas.com`. Mutations require approval.

**Auth:** API key. Create one in the Nylas Dashboard (https://dashboard.nylas.com) under API keys, and choose the region (`us` or `eu`) that matches where your Nylas application stores data. The key is sent as a bearer token. Most tools take a `grant_id` (a connected mailbox or calendar); list grants first to find it.

**Gaps:** OAuth is not offered. Nylas lets a developer register an application and redirect URI in the Dashboard, and the spec defines an `ACCESS_TOKEN` bearer scheme from OAuth 2.1 hosted auth, but the authorize and token endpoints are regional (`api.us.nylas.com` vs `api.eu.nylas.com`) and the region is a per-account field, while Executor's `oauth2()` declares static endpoint URLs. Such a token is also scoped to a single grant. The `ACCESS_TOKEN` path is a known gap. Operations that need an IAM management key or a Scheduler session token will not work with an application API key. Binary downloads (attachments, Notetaker media) are returned as the API returns them.
