# Devin

Devin (Cognition) sessions, knowledge notes, playbooks, schedules, secrets,
users, metrics and enterprise administration (audit logs, code scans,
consumption) through Devin's official v3 REST API.

Interface: OpenAPI, https://docs.devin.ai/v3-openapi.json (OpenAPI 3.1, 239
operations, 116 of them mutations, none skipped). The document declares no
servers, so the package sets the base URL `https://api.devin.ai`. Organization
operations take the organization ID in the path (`/v3/organizations/{org_id}/...`),
so pass it as a tool argument.

Auth (one method, `apiKey`, sent as `Authorization: Bearer <key>`):

- Organization service user key (`cog_` prefix): Devin > Settings > Devin API,
  "Service users" tab. Reaches `/v3/organizations/*`. The key is shown once; the
  organization ID is at the top of that page.
- Enterprise service user key: Enterprise settings > Devin API, "Service users"
  tab. Reaches `/v3/enterprise/*` and `/v3/organizations/*`.
- Personal access token: see https://docs.devin.ai/api-reference/authentication
  (it links to a separate PAT page; the creation steps are not on that page).
  Enterprise admins disable PATs by default via policy.

Docs: https://docs.devin.ai/api-reference/authentication.

Health check: `GET /v3/self` (every principal type returns `principal_type`).
Not exercised against a real key; no credentials were used.

Approvals: every mutation asks for approval.

Known gaps:

- Repository wiki and Q&A (`ask_question`, `read_wiki_*`, `list_available_repos`)
  exist only in Devin's MCP server at `https://mcp.devin.ai/mcp`, not in the REST
  spec, and are not included. That MCP server was not used because: an
  unauthenticated `initialize` (and one with an invalid Bearer key) succeeds and
  identifies itself as `DeepWiki` 2.14.3, and `tools/list` returns 24 tools
  without credentials, including `ask_wiki_question`, `list_wiki_repos`,
  `generate_wiki`, `devin_automation_manage` and `devin_user_list`, which differ
  from the 13 names the docs list. So `mcpHealth` cannot verify an account, and
  what a keyed session exposes is unconfirmed. Every live tool reports
  `readOnlyHint` null, so even read-only wiki queries would need approval.
  DeepWiki (https://mcp.deepwiki.com, keyless, public repos) is a separate
  product.
- The MCP docs say enterprise keys and PATs need an `X-Org-Id` header; the REST
  docs do not mention it (org is in the URL). Unverified with a real enterprise key.
- The icon is https://devin.ai/favicon.svg (425px vector); no official brand or
  press SVG was found.
