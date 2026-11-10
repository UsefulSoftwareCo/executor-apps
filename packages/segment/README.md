# Segment

Twilio Segment workspace management through the Segment Public API: sources, destinations, warehouses, tracking plans, functions, transformations, reverse ETL, audiences and spaces, users and groups, regulations, catalogs, and delivery and event-volume metrics. 202 tools, 102 of them mutations (every mutation asks for approval).

## Interface

OpenAPI, `document.json`: the official Segment Public API definition (version 73.6.0). Segment publishes it only inside the rendered reference at https://docs.segmentapis.com (the page's Download button is a browser blob, there is no stable file URL), so `document.json` is that definition with the embedded example payloads removed. Requests go to `https://api.segmentapis.com`.

## Auth

- **Public API token** (`apiKey`): in the Segment app open Settings, Workspace settings, Access Management, Tokens, and create a Public API token (not a Config API token). Only workspace owners can create one, and a token belongs to a single workspace. Sent as `Authorization: Bearer <token>`.

Segment's Public API also supports OAuth 2.0 for user-created apps (Business tier; the app is created under Access Management). It is a machine-to-machine client-credentials flow: the client signs an RS256 JWT assertion with a private key (key ID in the header, `sub` = the OAuth app ID, `client_assertion_type` jwt-bearer, scope `public_api:read_write`) and exchanges it at `https://oauth2.segment.io` (US) or `https://oauth2.eu1.segmentapis.com` (EU). It is not offered here because it needs a signing key pair, which the OAuth authorization-code helper cannot collect, so the API token is the only method a user can complete.

## Known gaps

- EU workspaces use `https://eu1.api.segmentapis.com`; only the US host is configured.
- The legacy Config API (`platform.segmentapis.com`, no new tokens since 2024) and the event-tracking and Profile APIs (which use write keys and Profile API access tokens) are not covered.
- The icon is Segment's own standalone green mark, taken from the SVG favicon served by the Segment app (https://app.segment.com), not the Twilio Segment lockup.
