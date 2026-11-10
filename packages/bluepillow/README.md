# Blue Pillow Hotels & Stays

Hotel and stay discovery for agents using Blue Pillow's B2A API: resolve destinations, search ranked stays, read property records, compare live offers across 16+ booking sites, get recommendations, re-validate offers and generate tracked booking links. Places to stay only (no flights or activities).

**Interface:** OpenAPI, Blue Pillow's official document at https://b2a.bluepillow.com/.well-known/openapi.yaml (API origin `https://api.b2a.bluepillow.com/v1`). The official remote MCP server (https://mcp.b2a.bluepillow.com/) exposes a subset of the same operations, so OpenAPI was chosen.

**Auth:** API key (bearer, `pk_anon_*`). B2A issues a free permanent anonymous key with no signup via `POST /v1/keys` (or the `b2a_get_key` MCP tool); paste it when connecting. See https://b2a.bluepillow.com/docs/api/keys/. No OAuth.

**Known gaps:** POST search/lookup operations are treated as mutations by the framework and require approval. The health check uses `POST /destinations/resolve` because no authenticated GET exists. Rate limits are low by default (see the B2A docs).
