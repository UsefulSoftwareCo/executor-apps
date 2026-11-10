# Deepgram

Deepgram speech AI: pre-recorded transcription (`/v1/listen`), text-to-speech, text intelligence (`/v1/read`), models, agent configurations and variables, projects, API keys, members and invites, usage, balances, billing and self-hosted credentials.

**Interface:** OpenAPI, Deepgram's official REST description at https://developers.deepgram.com/openapi.yml (also published in github.com/deepgram/deepgram-api-specs). 50 tools. The description lists `agent.deepgram.com` before `api.deepgram.com`; 49 operations, including the agent configuration and variable endpoints (`/v1/projects/{id}/agents`, `/agent-variables`), are pinned to `https://api.deepgram.com`, where Deepgram's reference documents them. `GET /v1/agent/settings/think/models` is served only from `https://agent.deepgram.com` (api.deepgram.com answers 404), so it is mounted by a second router under `agent.models.list`; the rest are under `api.`. Both hosts take the same key.

**Auth:** API key. Create one in the Deepgram Console: pick the project, then Settings > API Keys > Create a New API Key and paste it as the token; it is sent as `Authorization: Token <key>`.

**Gaps:** Streaming WebSocket endpoints (live transcription, Voice Agent) are not part of an HTTP tool surface. The hosted MCP at developers.deepgram.com (https://developers.deepgram.com/_mcp/server, linked from the docs index for AI clients) is a documentation server, so it is not used. OAuth is not offered by Deepgram.
