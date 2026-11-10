# Webvizio

Webvizio turns visual feedback and bug reports captured on websites into developer tasks. This package exposes 12 tools: list, inspect and select projects; list open tasks; read a task's description, AI prompt, screenshot URL and console, network, error and action logs; and mark a task Done.

**Interface:** custom tools over Webvizio's own REST API at `https://app.webvizio.com/api/mcp/v1`, the backend of Webvizio's official MCP server ([github.com/Webvizio/mcp](https://github.com/Webvizio/mcp), a local stdio server, not a remote one). Webvizio publishes no OpenAPI document or remote MCP endpoint. Endpoint paths come from the source of the official npm package `@webvizio/mcp-server` 1.0.5 (the published build of that repository).

**Auth:** API key, sent as a bearer token. Create it on the AI settings page, https://app.webvizio.com/profile/ai. Webvizio offers no OAuth for users.

**Known gaps:** only the endpoints used by the official MCP server are covered (the API is small). Project selection (`projects.select`) is stored by Webvizio per key, so `tasks.list` follows it. Webhook management is not covered: Webvizio's help center describes REST Hooks (bearer personal access token, separate technical documentation), but they are plan-gated (Advanced/Enterprise), use a different base URL (`https://app.webvizio.com/api/v1/webhook`), and are omitted from this package. Calls were not exercised against a live account.
