# Elai

Elai is an AI video platform. This package covers its public API: creating videos from scratch, text, HTML, URLs or PPTX, rendering, translating and copying videos, personalized batches, avatars, voices and voice customizations, templates, media-library uploads and folders, outlines, quizzes, live avatar streams, users, and webhooks.

**Interface:** OpenAPI 3.1, Elai's own "Elai Public API" document (96 operations) published through its ReadMe portal at https://elai.readme.io. Elai publishes no stable download URL, so a verbatim snapshot taken on 2026-10-12 from https://dash.readme.com/api/v1/api-registry/1j85n432mtn498yc (the id comes from `oasPublicUrl` on the portal's reference pages) is vendored as `document.json`; refresh it from that URL if Elai changes the API. Mounted against `https://apis.elai.io/api/v1`. All 96 operations become tools; the 68 non-GET ones require approval. No official MCP server was found in the docs reviewed (the search was not exhaustive). Search-style POST operations (`search-upload-folders`, `check-upload-usage`) look read-only but are still gated by approval like other non-GET operations.

**Auth:** API token (`secrets`). An admin generates it in the Elai app under Settings -> API (https://app.elai.io/api). It is sent as `Authorization: Bearer <token>`. The token is scoped to one workspace and acts as that workspace's admin. Elai does not offer OAuth.

**Known gaps:** Workspaces on the Unlimited plan cannot use the API; every request returns a bare 401. A few endpoints return binary data (SCORM zip) or need WebRTC (live streams), which are of limited use as tools. The rotate and revoke token endpoints invalidate the token the account uses.
