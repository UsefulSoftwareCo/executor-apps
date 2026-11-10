# Bland AI

Bland is a voice AI platform. This package exposes Bland's official remote MCP server: place and monitor outbound calls, fetch transcripts and recordings, build and validate conversational pathways, manage agents and their environments, query call analytics, run evals, and search the Bland docs. `bland_api_get` and `call_bland_api` reach any other endpoint of the REST API (for example SMS, via `call_bland_api`).

## Interface

MCP, official: `https://api.bland.ai/v1/mcp` (docs: https://docs.bland.ai/integrations/mcp/overview). Bland publishes no public OpenAPI document. Tools tagged read-only run without approval; all others ask first, as does `submit_feedback` (tagged read-only, but it sends a report to Bland's docs team).

## Auth

- API key: the organization key (`org_...`), sent as `Authorization: Bearer`. Create it in the Bland dashboard under Settings (https://app.bland.ai/dashboard/settings).

## Known gaps

- "Sign in with Bland" OAuth is not offered. Bland restricts OAuth to listed clients (ChatGPT, Claude, Claude Code) and documents dynamic client registration as not yet available; clients that only register dynamically "can't complete it yet". The authorization server metadata still advertises a registration endpoint and client ID metadata document support, which Executor could use, so this is a vendor-side limitation. Revisit when Bland opens OAuth to other clients.
- The server allows 120 requests per minute per organization.
