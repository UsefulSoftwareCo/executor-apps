# Botdog

LinkedIn outreach through Botdog: campaigns (create, pause/resume, archive, sequence, statistics), leads, lists, blacklists, snippets, sending and scheduling messages, connected accounts and their limits, webhooks, users, team and analytics.

**Interface:** OpenAPI, the vendor's official document at https://docs.botdog.co/openapi.json (API host `https://api.botdog.co`). Tools are compiled live from it.

**Auth:** API key only (Botdog offers no OAuth). Create a key in your Botdog team settings; it is a 32-character hex string sent as the `x-api-key` header. Paste it as the account's API key.

**Health check:** `GET /v1/teams/me`.

**Notes:** Every mutation requires approval, including message sends, which are irreversible and use the account's daily LinkedIn budget.
