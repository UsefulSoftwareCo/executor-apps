# Lyzr

Lyzr Agent Studio: create, run and manage AI agents, sessions, assets, channels, contexts, audit logs, A2A endpoints and more (294 tools).

## Interface

OpenAPI, from Lyzr's own FastAPI document at https://agent-prod.studio.lyzr.ai/openapi.json. The document declares no servers, so `baseUrl` is pinned to `https://agent-prod.studio.lyzr.ai`. Ten operations are removed with spec patches because they are service-to-service, webhook-receiver or diagnostic routes, not agent-facing: `/v3/contexts/internal/*` (3), `/v3/providers/internal/resolve-llm-credential`, the two `/v3/tools/webhooks/*` receivers, `/v3/channels/webhook/{channel_id}`, `/log/{session_id}`, `/diagnostics` and `/v3/credits/cache/refresh`. Five other operations that declare no security remain (the public A2A serve routes, `/v3/agents/utility/by-name/{agent_name}`, `/v3/features/`, `/v3/credits/cache`, `/health`); they are the vendor's public endpoints and receive the same API key header only where the compiler binds one.

## Auth

API key (`apiKey`), sent as the `x-api-key` header. Create it in Lyzr Studio: click the organization name in the top-left sidebar, choose Account & API Key, and copy the key. Lyzr offers no user-created OAuth apps.

## Known gaps

Seven operations that use only bearer-token (`HTTPBearer`) auth are skipped (`auth_method`). Other Lyzr services on separate hosts (voice, RAI, memory) are not covered.

The icon is a single white-on-black tile with no dark-theme variant; its edge blends into very dark backgrounds.
