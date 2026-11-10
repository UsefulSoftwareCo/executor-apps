# Habitica

Habits, dailies, to-dos, rewards, tags, checklists, parties, guilds, group chat, quests, challenges, webhooks, shops and inventory for a Habitica account.

**Interface:** custom tools written with `fetch` against Habitica's v3 REST API (`https://habitica.com/api/v3`, API rules at https://github.com/HabitRPG/habitica/wiki/API-Usage-Guidelines; endpoint reference generated from the apiDoc comments in https://github.com/HabitRPG/habitica/tree/develop/website/server/controllers/api-v3, since the old habitica.com/apidoc/ URL now returns 404). Habitica publishes its docs as an apiDoc site, not an OpenAPI document, so there is no official spec to generate from. Every tool takes its path ids as named inputs plus optional `query` and `body` objects.

**Auth:** a User ID and API token (`apiKey`). Find both in Habitica under Settings > Site Data > API. Habitica offers no OAuth for third-party apps. Credentials are sent as `x-api-user` and `x-api-key`, with a constant `x-client` header of the form `<Executor's Habitica UserID>-ExecutorHabitica`, as the usage guidelines require (the tool creator's ID, never the connected user's). The UserID in `index.ts` is currently a placeholder that must be replaced with the Executor-owned Habitica account's ID before release. Health check reads `_id` from `GET /user?userFields=profile`; Habitica's auth middleware always loads `_id`.

**Known gaps:** the account-data export endpoints (`/export/*`, outside `/api/v3`) and the `hall`/admin endpoints are not exposed. Habitica rate-limits per user/IP; the `X-RateLimit-Limit` response header is the source of truth (about 30 requests per minute was observed in a live test by a third party), and background scripts should wait 30 seconds between calls.

**Vendor rules:** the usage guidelines say a tool used by others must have reviewable code in a public repository. Executor ships this package from a private checkout; whether that satisfies the rule is unresolved and needs an owner decision (the `v2` export mirror is public, which may satisfy it).

**Icon:** the vendor's own gryphon.svg (HabitRPG/habitica), recolored to #7b4bd8 so it is visible on light and dark; this departs from the vendor's colour.
