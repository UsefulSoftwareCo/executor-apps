# Sidetracker

Covers the Sidetracker (sidetracker.io) cookie-free web analytics API: visitor sessions and their visits, session notes, converted sessions, lists and list rows, and trigger execution.

Interface: OpenAPI, Sidetracker's own document at https://app.sidetracker.io/api/schema (Redoc reference at https://app.sidetracker.io/api/schema/redoc). The document declares no servers, so the package pins `https://app.sidetracker.io`.

Auth: API key. In Sidetracker open the user menu, Settings, API keys, and create a key. It is sent as `Authorization: Token <key>`. Sidetracker has no user-created OAuth apps.

Known gaps: the document has no response schemas (responses are untyped). The two inbound webhook receivers (Calendly, Pipedrive) are excluded because the vendors call them, not users. Webhooks to your own URL are configured in the Sidetracker settings, not through this API.
