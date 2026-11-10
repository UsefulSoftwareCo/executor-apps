# Iterable

Manage Iterable users, lists, campaigns, templates, catalogs, journeys, events, in-app and embedded messages, snippets and data exports.

Interface: OpenAPI (Swagger 2.0), from Iterable's own raw API specification at https://api.iterable.com/api-docs, linked from the API explorer at https://api.iterable.com/api/docs (159 operations, none skipped). The EU data center serves the same document at https://api.eu.iterable.com/api-docs; each account picks its data center and the package uses that host and document. API reference: https://api.iterable.com/api/docs.

Auth: API key. Create one in Iterable under Integrations > API keys, choosing a type that fits the calls you need (server-side keys are the ones that cover the management API). Enter the data center your project lives in as `us` (api.iterable.com) or `eu` (api.eu.iterable.com). The key is sent in the `Api-Key` header to that host only. JWT-enabled keys, which additionally require a per-request JWT, are not supported.

Known gaps:
- The spec declares an `api_key` scheme and a top-level `security: [{ api_key: [] }]` but no per-operation security. The compiler honors the top-level requirement, so every operation already sends the `Api-Key` header; the package's `fallbackSecurity` only restates it.
- `previewEmailTemplate` and `previewInAppTemplate` are POSTs that only render a preview, so they are exposed as queries (no approval); every other non-GET operation is a mutation and needs approval.
- Iterable also ships a local npm MCP server and CLI; they are not used here.
- The icon is the Iterable mark taken from the vendor's site logo (iterable.com), recolored to the dark navy of its favicon.
