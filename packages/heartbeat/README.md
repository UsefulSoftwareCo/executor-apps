# Heartbeat

Manage a [Heartbeat](https://heartbeat.chat) community: users, groups and memberships, channels and categories, threads, comments, chat and direct messages, events and attendance, courses and lessons, documents, videos, invitations, notifications and webhooks.

**Interface:** OpenAPI. Heartbeat documents its REST API (`https://api.heartbeat.chat/v0`) on ReadMe at https://heartbeat.readme.io, one OpenAPI fragment per operation page and no combined document. `openapi.ts` embeds those official fragments merged into one document (40 paths, 55 operations). Re-merge it if the reference changes.

**Auth:** API key (`apiKey`), sent as `Authorization: Bearer <key>`. Request or create it in your community's admin settings (see https://heartbeat.readme.io/reference/authorization). Heartbeat has no OAuth for third-party apps.

**Gaps:** Mutations require approval. Heartbeat creates with `PUT` and updates with `POST`, as in its reference. The reference describes responses loosely, so output schemas are sparse.
