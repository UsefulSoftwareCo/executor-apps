# Lettr

Lettr transactional email and campaigns: send and schedule emails, inspect delivery events, manage sending domains, templates, webhooks, and the audience (lists, contacts, topics, properties, segments) and campaigns.

**Interface:** OpenAPI, from Lettr's own published document at https://docs.lettr.com/openapi.json (API origin `https://app.lettr.com/api`). Mutations require approval.

**Auth:** API key (Bearer token). Create one in the Lettr dashboard under API Keys (https://docs.lettr.com/learn/api-keys/introduction). Lettr documents no user-created OAuth apps, so no OAuth method is offered. The account health check calls `GET /auth/check`.

**Gaps:** The key's permission level and IP restrictions apply; sandbox keys cannot send real mail.
