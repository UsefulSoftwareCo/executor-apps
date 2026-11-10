# Helpwise

Helpwise shared inbox: list, close, trash and tag conversations, manage contacts and custom fields, send SMS, WhatsApp and email, add internal notes, assign conversations, and read mailboxes, users and reports (44 tools).

## Interface

Hand-written tools over Helpwise's REST APIs. Helpwise publishes no OpenAPI document, only an official Postman collection (https://documenter.getpostman.com/view/29744652/2s9YC5yYKf), which is the source of every endpoint. It documents two generations of the API: V1 at `https://apis.helpwise.io` (conversations, contacts, tags, custom fields, SMS/WhatsApp, reports) and V0 at `https://app.helpwise.io/dev-apis` (mailboxes, users, threads, emails, notes, chat, legacy contacts). Both are covered. Mutations require approval; V0 read endpoints, though POST requests, are exposed as queries.

## Auth

- API key and secret: both are shown under Settings, API Key in Helpwise (https://app.helpwise.io/settings/api). V1 requests send `Authorization: Basic base64(key:secret)`; V0 requests send `key:secret` as the raw header value. This is quoted from the Postman collection: all 18 V0 requests set the header `Authorization: {API_KEY}:{API_SECRET}` (no `Basic` prefix), while the collection-level V1 auth is Basic and the intro says to send `Basic BASE_64(API_KEY:API_SECRET)`.

## Known gaps

- Rate limit is 100 requests per minute per key.
- The form-submission webhook endpoint (`webhook.helpwise.io/forms/{hash}`) and the inboxes report (no URL in the docs) are not covered.
- The V0 header format and the V1 array query encoding (`inboxIds[]`, `tagId[]`) are taken from the Postman collection and have not been exercised against a live account; V1 request/response shapes are likewise unverified live.
- Interface check: Helpwise publishes no OpenAPI/Swagger document and no official MCP server that could be found (docs.helpwise.io, the Postman docs, GitHub search); the Postman collection is the only official machine-readable source. The health check uses `GET /tags`, which the docs show returning a top-level JSON array.
- The icon is Helpwise's official 361px app icon (PNG); no SVG is published.
