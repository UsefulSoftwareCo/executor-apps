# Fireflies

Fireflies.ai meeting assistant: transcripts, summaries, action items, soundbites, live meeting bot, and workspace/user administration.

**Interface:** GraphQL, the vendor's primary API, at `https://api.fireflies.ai/graphql` (docs: https://docs.fireflies.ai). Tools are generated from the schema; every mutation requires approval. (Fireflies also has an OAuth-only MCP server at `https://api.fireflies.ai/mcp`; the GraphQL API exposes more.)

**Auth:** API key sent as `Authorization: Bearer <key>`. Create it in Fireflies under Integrations > Fireflies API (see https://docs.fireflies.ai/fundamentals/authorization). Fireflies offers no user-created OAuth apps for the GraphQL API, so there is no OAuth method.

**Icon:** the official Fireflies app icon (PNG, 180px) from fireflies.ai; Simple Icons has no entry.

**Gaps:** the Realtime API (WebSocket) is not exposed. Tools come from live introspection, so they appear once an account is connected.

**Known gaps:** tools are generated at runtime from GraphQL introspection after an account is connected, so the tool count was not verified without a real API key (introspection returns `auth_failed` unauthenticated).
