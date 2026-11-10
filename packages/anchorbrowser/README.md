# Anchor Browser

Cloud browser infrastructure for AI agents: create and control browser sessions, run natural-language web tasks and versioned automation tasks, take screenshots and PDFs, manage identities, profiles, extensions, certificates, recordings and batch sessions.

**Interface:** OpenAPI, Anchor's own document at https://docs.anchorbrowser.io/openapi.yaml (server https://api.anchorbrowser.io). Every mutation requires approval. The hosted MCP server (https://api.anchorbrowser.io/mcp) was considered and not used: its vendor docs describe per-site domain actions rather than the REST surface, which the OpenAPI covers in full.

**Auth:** API key only (Anchor Browser does not offer user-created OAuth apps for the REST API). Its hosted MCP server at https://api.anchorbrowser.io/mcp has its own OAuth sign-in, which this package does not use. Create a key at https://app.anchorbrowser.io under API Access. It is sent as the `anchor-api-key` header. The health check calls `GET /v1/sessions/all/status`.

**Icon:** the Anchor brand symbol (main-logo-symbol.svg) from the vendor's website assets; not in Simple Icons. Black on light, redrawn white for dark; checked on white and near-black.

**Gaps:** CDP/WebSocket control of a running session is outside the REST API and not exposed as tools. Endpoints returning binary data (screenshots, PDFs, recordings) depend on the generic OpenAPI response handling. Teams using Agent Access identity enforcement must also send an `anchor-identity-token` header; this package sends only `anchor-api-key`.
