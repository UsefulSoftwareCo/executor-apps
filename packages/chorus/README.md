# Chorus

Chorus (by ZoomInfo, formerly Chorus.ai) conversation intelligence: list engagements (meetings and dialer calls), read a conversation's summary, action items, trackers and transcript, get media download links, read captured emails and threads, scorecards, moments, playlists, saved filters, users and teams, and delete or export recordings. 20 hand-written tools.

## Interface

Custom `fetch` tools against `https://chorus.ai`, written from Chorus's official API reference at https://api-docs.chorus.ai/. Chorus publishes only a Postman collection, not an OpenAPI document, so there is no spec to compile. The documented v3 API (`/v3/users`, `/v3/engagements`, deletes) is used for users and engagements; the v1 JSON:API endpoints (`/api/v1/...`) cover conversations, emails, scorecards, moments, playlists, filters and teams. Mutations (delete, export) ask for approval.

## Auth

API token (`apiKey`). In Chorus, open Settings > Personal Settings > API Access and click Generate API Token (shown once). The user's role must be allowed Chorus API access in Roles & Permissions; the token carries that user's data access, and private recordings are never returned. The token is sent as the raw `Authorization` header value, with no `Bearer` prefix, as the vendor docs specify. OAuth is not offered; Chorus has no user-created OAuth apps.

## Known gaps

- Recording upload (`POST /v3/upload`, multipart media) and the CRM/calendar/video-conference integration setup, user settings, playlist/moment/filter writes and bulk conversation upload endpoints are not exposed.
- The v1 documentation is reported by third parties to be partly inaccurate after the ZoomInfo acquisition; query parameter names follow the published collection and are not verified against a live account.
