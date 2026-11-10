# Typecast

Typecast AI voice platform: text to speech (including streaming and word/character timestamps), voice listing and details (v2 and v3), instant voice cloning, custom voices and subscription/credit info.

**Interface:** OpenAPI, Typecast's official document at https://typecast.ai/docs/api-reference/openapi.json (base URL `https://api.typecast.ai`). Typecast also runs a hosted MCP server at https://typecast.ai/docs/mcp, but it is documentation-only without a key, so the OpenAPI document gives more tools.

**Auth:** API key (`X-API-KEY` header). Create one in the Typecast API console at https://studio.typecast.ai/developers/api. Typecast offers no user-created OAuth apps. The health check reads `/v1/users/me/subscription`.

**Known gaps:** The spec also lists a Bearer JWT scheme used by Typecast's own web app; it is not offered. Binary audio responses depend on how Executor handles non-JSON bodies.
