# Ragic

Ragic is a no-code online database builder. This package lists, searches, creates, updates and deletes sheet records, reads sheet schemas, comments, locks and unlocks records, runs action buttons, and starts mass update/lock operations with task status polling (14 tools).

Interface: hand-written tools over Ragic's HTTP API, documented at https://www.ragic.com/intl/en/doc-api. Ragic publishes no GraphQL API or official MCP server. Its docs page is a Redocly page titled "Ragic HTTP API (3.0)" with a "Download OpenAPI specification" link, but that link has no hosted file: the spec is only embedded in the page's HTML (the Redoc state), and none of the guessed URLs under `https://www.ragic.com/docs/api/` (`openapi.json`, `openapi.yaml`, `swagger.json`, `spec.json`) or `/intl/en/doc-http-api/openapi.json` exist. It also covers only 8 GET read/export operations with a templated `/{apname}{path}/{sheetIndex}` path and a `{server}` variable, so it has no create/update/delete/comment/mass operations and cannot be mounted as a stable-URL spec. Hence the hand-written tools. Revisit if Ragic hosts the spec. Every request pins `version=2025-01-01`.

## Auth

API key (`apiKey`). Create it in Ragic under Personal Settings, API key (a dedicated API user is recommended). It is sent as `Authorization: Basic <key>`. The account also needs the Ragic `server` (one of `www`, `na3`, `ap2`, `ap5`, `ap8`, `eu2`, as shown in your Ragic URL host) and the `account` name (the first path segment of your Ragic URL). Ragic offers no user-creatable OAuth apps.

Sheets are addressed as `<tab folder>/<sheet index>` (for example `sales/1`) as in the Ragic URL.

## Known gaps

- Health makes no network call (Ragic has no read-only current-user endpoint; `/AUTH` needs a password). It only validates the server name (an optional sheet path cannot be added to the account fields, and every authenticated endpoint needs one); a bad key or account surfaces on the first tool call.
- Only the servers named in Ragic's docs (`www`, `na3`, `ap2`, `ap5`, `ap8`, `eu2`) are allowed because `hosts` must be declared; Ragic gives no complete list, so another regional server needs adding to `hosts` and `servers` in `index.ts`.
- File upload/download, exports (xlsx/pdf), approvals, import from URL and the other mass operations are not exposed. Mass update/lock send record ids as repeated `recordId` query parameters (or `where`) and the documented bodies (`{action:[{field,value}]}` and `{action:"lock"|"unlock"}`); comments are sent as multipart/form-data with `c`. These follow the docs but are untested against a live account.
