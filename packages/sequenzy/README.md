# Sequenzy

Email marketing and automation for developers: subscribers, tags, events, sequences, campaigns, templates, transactional email, domains, analytics and workspace settings (401 tools).

**Interface:** OpenAPI. The vendor's official document, https://docs.sequenzy.com/openapi.yaml, is loaded live; base URL `https://api.sequenzy.com/api/v1`. Sequenzy also runs an official remote MCP server (`https://api.sequenzy.com/v1/mcp`), but the REST API covers the same surface with typed tools, so it is not mounted.

**Auth:** API key only. Create one in the Sequenzy dashboard under Settings, API Keys & SMTP (https://www.sequenzy.com/dashboard); it is sent as `Authorization: Bearer`. Sequenzy's OAuth is offered only to its own MCP server (dynamic client registration), not to the REST API, so there is no OAuth method. The key's scopes limit which tools succeed. Health check calls `GET /account`, which the spec documents without any scope requirement (it returns the key's own permission summary).

**Approvals:** every mutation asks for approval.

**Gaps:** one operation is skipped (unresolvable schema reference); the legacy `/v1` server alias in the spec is not used.
