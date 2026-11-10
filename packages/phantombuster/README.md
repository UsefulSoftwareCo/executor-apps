# PhantomBuster

Run and manage PhantomBuster automation: agents (Phantoms), their runs and console output, scripts and branches, lead lists, lead and company objects in organization storage, usage exports, identities, captcha solving and AI credits (56 tools).

Interface: hand-written tools over the REST API v2 at `https://api.phantombuster.com/api/v2` (documented at https://hub.phantombuster.com/reference). PhantomBuster publishes no OpenAPI document. Its hosted MCP server (`https://mcp.phantombuster.com`) is OAuth-only through a Stytch authorization server with dynamic client registration and is aimed at building scripts and AI assistants, so it exposes less than the REST API. Endpoint paths and parameters were taken from the API reference.

Auth: API key. Create one in PhantomBuster under Workspace settings, API keys. It is sent as the `X-Phantombuster-Key` header to `api.phantombuster.com` (the host the live API and the vendor OpenAPI spec use; the docs prose also mentions `X-Phantombuster-Key-1`, but the live API itself names `X-Phantombuster-Key`). The two CSV export tools return `{ csv }` text. The health check calls `/orgs/fetch`, which has no side effects. PhantomBuster offers no OAuth for the REST API.

Approvals: every tool that writes, launches, stops or deletes asks for approval.

Known gaps: bodies for lead objects, company objects, agent groups, captcha and AI completions are passed through as free-form JSON because the reference leaves their shapes open; an unverified key cannot be checked here, so these were not called against the live API.
