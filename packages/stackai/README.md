# StackAI

Build and run StackAI workflows from an agent: list, inspect, create, edit, validate and run projects, browse connections and knowledge bases, and use the other tools the server exposes (see the [tool reference](https://docs.stackai.com/stackai-mcp/tool-reference.md)).

## Interface

StackAI's official remote MCP server, `https://mcp.stack.ai/mcp` ([docs](https://docs.stackai.com/stackai-mcp/overview.md)). Mounted through `mcpRouter`. Tools without `readOnlyHint` require approval.

## Auth

OAuth only. The server publishes OAuth metadata with dynamic client registration, so the package uses `oauth2({ discover })`: no app to create. Sign-in runs in the browser on StackAI's auth host (`fbsuadfqhklxokmlhtsd.supabase.co`), which receives the authorization code and refresh token. Then confirm the active organization (switchable later with the `switch_org` tool). The redirect URI is registered automatically.

## Known gaps

StackAI also has a REST API (`api.stack-ai.com`, personal `sk_` API keys) but publishes only per-endpoint OpenAPI fragments in its docs, with no single document at a stable URL, so it is not mounted. API-key auth is therefore not offered. The vendor documents 51 tools; the MCP probe was run unauthenticated, so they were not enumerated here.
