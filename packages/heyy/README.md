# Heyy

Covers the Heyy business messaging API v3: workspace, channels, chats, WhatsApp message and template sending, contacts and contact attributes, campaigns and recipients, labels, teams, automations, journeys, file upload and API webhooks.

Interface: OpenAPI 3.1, the vendor's own v3 document at https://docs.heyy.io/api-reference/openapi-v3.json (API base `https://api.heyy.io/v3`). 72 operations; 11 `POST /*/search` operations only read, so they are treated as queries and need no approval. The health check calls `GET /workspace`.

## Auth

- API key (bearer token). In the Heyy web app, open https://app.heyy.io/settings/api-keys, click Create API key, name it and copy the key.

Heyy offers no OAuth for user-created apps. Every other mutation requires approval.

## Known gaps

- Heyy API v2 is deprecated and sunsets on 2026-11-01 (https://docs.heyy.io/api-reference/v3/versioning.md). This package targets v3 only, so v2-only behavior is not covered.
- The tool set follows the published v3 OpenAPI document; operations the document omits are not available.

Icon: the Heyy app logo mark (vector SVG) from the vendor's documentation site assets (https://docs.heyy.io).
