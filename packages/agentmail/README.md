# AgentMail

Email inboxes for AI agents with [AgentMail](https://www.agentmail.to): inboxes, threads, messages, drafts, attachments, labels, custom domains, pods, lists, webhooks, metrics and API keys (147 tools; the 69 mutations require approval).

**Interface:** OpenAPI, the vendor's official document at https://www.agentmail.to/openapi.json (the bare `agentmail.to` host redirects, so the package uses the `www` URL). The spec lists four server origins; the package talks only to `https://api.agentmail.to`.

**Auth:** API key only. Create one in the [AgentMail console](https://console.agentmail.to); it is sent as a Bearer token. AgentMail's hosted MCP server also offers OAuth, but the REST API has no user-created OAuth app flow, so `oauth2` is not offered.

**Known gaps:** the EU region (`api.agentmail.eu`) and the x402/MPP pay-per-request origins are not supported. The unauthenticated `agent/sign-up` endpoints are exposed as tools but are only useful for creating a new organization.
