# Signaturely

Signaturely e-signature platform: documents and signers, signing requests from templates (including bulk send), templates, folders, team members and webhooks.

Interface: hand-written tools over the REST API documented at https://docs.signaturely.com (base URL `https://api.signaturely.com/api/v1`). Signaturely publishes no OpenAPI document, MCP server or GraphQL API, so the tools mirror the documented endpoints. Request bodies are passed through as JSON in `body`; filters go in `query`.

Auth: API key. Create it in Signaturely under Settings, API (https://app.signaturely.com/settings/api). It is sent as `Authorization: Api-Key <key>`. Signaturely offers no OAuth for third-party apps.

Known gaps: none of the documented endpoints are omitted, but body fields are not validated locally, so consult the API reference for required fields. Signing requests accept `testMode`.
