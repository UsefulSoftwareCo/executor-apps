# Aircall

Calls (history, search, AI transcription, summary, topics, sentiments, action items, comments, tags, transfers, recording controls), users and availability, numbers and their messaging configuration, SMS/MMS/WhatsApp sending, contacts, tags, teams, webhooks, dialer campaigns and conversation intelligence trackers in the Aircall cloud phone system.

**Interface:** hand-written tools over the Aircall Public API (`https://api.aircall.io/v1`), documented at <https://developer.aircall.io/api-references/>. Aircall publishes no OpenAPI document (the docs only offer an HTML reference and `llms.txt`), and the only machine-readable specs found are unofficial third-party conversions, which this package does not use. Create, update and action tools take a `body` object as described in each tool's description; consult the API reference for every field.

**Auth**
- API key (Basic): in the Aircall Dashboard open Integrations > API Keys, generate a key, and enter the API ID and API token (shown once).
- OAuth: Aircall issues the OAuth client ID and secret to technology partners on request (the "start building" form on the developer site). Register the Executor redirect URI as the app's redirect URI. Tokens do not expire. Only Aircall admins can install an OAuth integration.

Health check calls `GET /v1/ping`.

**Known gaps:** the V2 Users endpoints (`/v2/users`), analytics report export, AI voice agent/outbound agent endpoints, number-level AI endpoints, integration enable/disable, and campaign contact imports are not exposed. The newer AI call endpoints (playbook, custom summary, predicted CSAT, realtime transcription) are also omitted. Calling `search` endpoints needs the query parameters in a `params` object.
