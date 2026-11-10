# Amazing Marvin

Tasks, projects, categories, labels, goals, today and due lists, calendar events, time tracking, habits, reminders, reward points and raw document access for [Amazing Marvin](https://amazingmarvin.com).

**Interface:** hand-written tools over Marvin's official REST API (`https://serv.amazingmarvin.com/api`), documented at https://github.com/amazingmarvin/MarvinAPI/wiki/Marvin-API. Marvin publishes no OpenAPI document, GraphQL API or MCP server, so each endpoint is a typed tool (34). Every mutation requires approval.

**Auth:** Marvin has no OAuth. Two methods, both using tokens from the API strategy in the app (https://app.amazingmarvin.com/pre?api):

- API token (`X-API-Token`): tasks, lists, tracking, habits, rewards, reminders set/delete, events.
- API token and full access token (`X-Full-Access-Token`): additionally `docs.*` (raw document get/update/create/delete), `reminders.list`, `reminders.deleteAll`, `rewards.reset` and `habits.list` with `raw`. Tools that need it fail with a clear error on an API-token-only account.

**Icon:** Marvin's mascot from https://amazingmarvin.com/images/Marvin-nobg.png, resized to 256px wide (2x) and embedded as a PNG in an SVG, because Marvin publishes no vector logo and Simple Icons has no entry.

**Known gaps:** `projects.add` takes `day` as any JSON value so that `null` (the vendor's documented unscheduled form) can be sent; omitting it was not tested. the API has no endpoint to update or complete tasks beyond the experimental `markDone` and `docs.update`; many endpoints are marked experimental by the vendor. There is no read endpoint for a single task except `docs.get`. Marvin documents no rate limits. Not verified against a live account.
