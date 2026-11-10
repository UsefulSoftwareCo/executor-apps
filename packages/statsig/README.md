# Statsig

Manage Statsig feature gates, experiments, dynamic configs, layers, metrics, segments, tags, users and project settings through the Statsig Console API.

**Interface:** OpenAPI. The official Console API document is at https://api.statsig.com/openapi/20240601.json (base URL `https://statsigapi.net`). Every mutation requires approval.

**Auth:** Console API key (`STATSIG-API-KEY` header). Create one in the Statsig console under Project Settings, API Keys (https://console.statsig.com/api_keys). Statsig does not offer user-created OAuth apps for the Console API.

**Known gaps:** The server-side evaluation and event-logging HTTP API (`api.statsig.com`, server secret keys) is not covered. Statsig also runs an official MCP server at https://api.statsig.com/v1/mcp. It requires OAuth, so it was not evaluated; this package uses the OpenAPI document (325 operations, API-key auth). Every request sends `STATSIG-API-VERSION: 20240601`, as Statsig's docs recommend (the header is optional today and will become required).
