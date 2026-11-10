# Markup AI

Run Markup AI content agents (style, brand voice, brand terms, clarity, claims, persona and more) on text, track agent and style-agent workflows, and manage term sets, terms, domains, personas, brand voice profiles, style guides and style targets.

Interface: OpenAPI, from Markup AI's official API reference document at https://docs.markup.ai/openapi.json (server https://api.markup.ai). Markup AI also hosts an MCP server at https://api.markup.ai/mcp/ with three tools; the REST API covers far more, so it is not used.

Auth: API key only, sent as a Bearer token. An administrator creates keys in the Markup AI console (https://console.markup.ai) under API Keys (https://docs.markup.ai/admin/api-keys). Markup AI does not offer user-created OAuth apps for the REST API.

Paths in the spec are relative to https://api.markup.ai with no `/v1` prefix (the `/v1/...` URLs in some docs examples return 404); the package uses the spec paths.

Known gaps: the multipart operations (`brandTerms.importTerminology` POST /brand-terms/ and `styleAgent.runStyleAgentFile` POST /style-agent/run-file) are included as tools but untested against the live API. `GET /agents/workflows/{workflow_id}/stream` is an SSE endpoint that the spec mislabels as application/json; a tool cannot consume an event stream, so it is removed from the tool set via a spec patch. Poll the workflow status tools instead. Running agents consumes organization word quota; every mutation requires approval.
