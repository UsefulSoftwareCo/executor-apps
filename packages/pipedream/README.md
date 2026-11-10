# Pipedream

Pipedream Connect and the Pipedream REST API: projects, external users, connected accounts, apps and categories, actions, triggers, deployed triggers (events, pipelines, webhooks), custom OAuth clients, app overrides, usage, session tokens and the Connect proxy.

Interface: OpenAPI, from Pipedream's official document at https://pipedream.com/docs/pipedream_openapi_swagger.json (API origin `https://api.pipedream.com`). Mutations ask for approval.

Auth, two methods. User API key: copy it from https://pipedream.com/user; it is sent as a bearer token, but Pipedream supports user API keys on only a limited set of endpoints, so Connect tools may be rejected. OAuth 2.0 client credentials (recommended): Create an OAuth client in Pipedream under Settings > API (https://pipedream.com/settings/api) and enter its client id and secret on the connect page; Executor exchanges them for a bearer token at `https://api.pipedream.com/v1/oauth/token` with scope `*`. There is no redirect URI because no user authorization step is involved.

Known gaps: most tools need a `project_id` path argument and an `x-pd-environment` header argument (`development` or `production`); tools do not default them. The legacy workspace API-key API (`/v1/users/me`, workflows, sources) is not part of the published OpenAPI document and is not covered. Operations authenticated only by a short-lived Connect token (`ctok_...`) are exposed but need a token minted with the token tools.
