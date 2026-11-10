# Honeycomb

Honeycomb observability: datasets, columns, queries and query results, boards, SLOs, burn alerts, triggers, markers, recipients and API keys, plus Honeycomb's hosted MCP server for natural-language querying and analysis of telemetry. This package covers the standalone "Honeycomb MCP" catalog target too.

## Interface

- `api`: Honeycomb's official OpenAPI document, https://docs.honeycomb.io/api/openapi-public.yaml (US host `api.honeycomb.io`, EU host `api.eu1.honeycomb.io`).
- `mcp`: Honeycomb's official remote MCP server, https://mcp.honeycomb.io/mcp.

## Auth

- API, Configuration key: create it in Honeycomb under Environment Settings > API Keys. Enter the key and the region (`us` or `eu`). Its permissions decide which tools succeed.
- API, Management key: create it under Team Settings > API Keys, and enter it as `<key id>:<secret>` with the region. Used for `/2` team-level endpoints such as API key management.
- MCP: OAuth with dynamic client registration (discovered from `mcp.honeycomb.io`); no client setup is needed. Scopes `mcp:read` and `mcp:write` are granted by Honeycomb.

## Known gaps

Ingest-only operations (events, batch, Kinesis) need an ingest key, which the configuration-key method sends in the same header, so it works if you enter an ingest key. Firehose access-key auth is not supported. Mutations ask for approval.
