# Planly

Schedule social media posts with Planly across Instagram, TikTok, X, LinkedIn, Facebook, YouTube, Pinterest, Threads, Mastodon and Bluesky. Covers teams, channels, the media library (URL import and direct upload), schedules, schedule groups (with drafts) and Planly's AI text completion: 23 hand-written tools.

## Interface

Hand-written tools over Planly's official REST API (`https://app.planly.com/api`), documented at https://docs.planly.com/. Planly publishes no OpenAPI document, so each operation is written from that reference. The API is mostly POST with JSON bodies; `channels.delete` and `ai.credits` are GET, as documented. Mutations require approval.

## Auth

- API key: in Planly, open Settings > Security and copy the API key. It is sent as `Authorization: Bearer <key>` to `app.planly.com`.

The Planly docs describe only API keys, so no OAuth is offered.

## Known gaps

- Direct media upload is two tools (`media.startUpload`, `media.finishUpload`) plus a PUT to the pre-signed URL that the agent must make itself; prefer `media.importFromUrl`.
- Per-network post `options` are passed through as free-form JSON (see the "Social Network Options" section of the Planly docs).
- The Planly `users` and `transfer-ownership` team endpoints and the Pinterest board list are included as documented, but were not called against a live account.
