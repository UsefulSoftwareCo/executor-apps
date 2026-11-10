# Sympla

Manage Sympla events from Executor: list events, read orders, participants and presentations (sessions), and check participants in by ID, ticket number or QR code.

Interface: OpenAPI, Sympla's official contract at https://developers.sympla.com.br/api-docs (base URL https://api.sympla.com.br/public). The document repeats every operation under v1.5.0, v1.5.1 and v1.6.0; only the current v1.6.0 operations are exposed, and the `/error` probe is removed.

Auth: API token (`apiKey`), sent in the `s_token` header. The organizer creates it in Sympla under Minha Conta > Integracoes. Sympla offers no OAuth for organizers, so there is no OAuth method. Check-in operations are mutations and require approval.

Known gaps: the public API is read-mostly. It cannot create or edit events, ticket types or orders. Icon is Sympla's official app icon (PNG from sympla.com.br).
