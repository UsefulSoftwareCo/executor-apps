# Stormboard

Covers the Stormboard v1 REST API: Storms (create, update, close, duplicate, invite, join, favorites, sections, legend), ideas (create, update, delete, votes, comments, tasks, connectors), tags, chat, folders, templates and the current user's profile and notifications.

**Interface:** hand-written tools generated from Stormboard's own route reference, served as JSON at https://api.stormboard.com/json (rendered at https://api.stormboard.com/docs). Stormboard publishes no OpenAPI document, so each tool takes its path ids, plus `query` (reads) or `body` (writes, sent as JSON) and lists the documented parameters in its description. Request bodies on POST/PUT are sent as JSON; the docs do not state the body encoding and it could not be confirmed without a live key, so a 400 on a write may mean the API wants form encoding. DELETE tools send their parameters (for example `from_idea_id`/`to_idea_id` on `ideas.deleteConnectorBetween`) in `query`. Idea, comment and connector ids are strings because the docs allow an ID or UUID.

**Auth:** API key only. Create it on the API tab of your account at https://www.stormboard.com/users/account#api; it is sent as the `X-API-Key` header. Stormboard also supports OAuth 2.0, but OAuth clients are registered by contacting Stormboard support, so users cannot create one themselves and it is not offered.

**Gaps:** the unauthenticated account endpoints (create user, verify, username/password key exchange) are left out. Some endpoints need a team subscription or team ownership and answer 401 otherwise. Tools were not called against a live account.
