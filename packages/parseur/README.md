# Parseur

Parseur extracts structured data from emails, PDFs and other documents. This package exposes the Parseur API: mailboxes (parsers), documents (upload, process, skip, copy, logs), templates, webhooks and export configs.

**Interface:** OpenAPI, generated live from Parseur's official document at https://api.parseur.com/openapi.json (29 tools, 19 of them mutations that require approval).

**Auth:** API key only. Create one at https://app.parseur.com/account/api-keys. It is sent as `Authorization: Token <key>` (the vendor documents the Token prefix as optional but accepted). Parseur offers no OAuth for user-created apps.

**Gaps:** The spec declares no server, so the base URL `https://api.parseur.com` is set in `openapi.ts`. Multipart file upload operations depend on how the generator handles multipart bodies.
