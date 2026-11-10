# Userflow

Userflow is product onboarding software (flows, checklists, launchers, banners). This package covers the whole Userflow Users API: users, groups (companies) and memberships, event tracking, content (flows, checklists and the like) and their versions, content sessions with survey answers, attribute and event definitions, and webhook subscriptions. 25 tools.

**Interface:** hand-written tools over `https://api.userflow.com`. Userflow publishes its reference at https://docs.userflow.com/docs/api but no OpenAPI document, so each operation was written from that reference. Every request sends `Userflow-Version: 2020-01-03`. Mutations (upserts, deletes, event tracking, ending sessions, webhook changes) require approval. Condition filters are passed as JSON strings in `condition`.

**Auth:** environment API key, sent as `Authorization: Bearer <key>`. Create it in Userflow under Settings > API (https://userflow.com/app/_/settings/api); each environment (Production, Staging) has its own keys. Environments in the EU region use `https://api.eu.userflow.com`, so connect with the "EU region" key method for those. Userflow has no OAuth for this API.

**Gaps:** the Accounts API (team members, invites, accounts; personal API keys `pak_...`) is not included. Whether memberships can be created directly (`POST /group_memberships`) is unverified; only deletion is exposed, and `users.upsert` with `memberships` or `groups` is the supported route. Two endpoints could not be confirmed against the official reference (the docs site returns 403 to automated fetches) and are unverified: `PATCH /webhook_subscriptions/:id` (webhooks update) and `POST /content_sessions/:id/end` (sessions end). The docs site sits behind a bot challenge, so the reference was read through a text mirror.
