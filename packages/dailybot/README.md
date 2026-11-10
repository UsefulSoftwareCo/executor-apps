# Dailybot

Covers Dailybot's async standups and team tools: check-ins (list, configure, questions, responses), pre-built templates, forms and form responses with approval transitions, teams and members, the user directory, labels, bot messages and email, kudos, mood tracking, important dates, automations (including firing `api_trigger` workflows) and webhook subscriptions. The Dailybot Plan (beta) project-management endpoints under `/v1/plan/` and the agent, CLI and commands-platform groups are not exposed.

**Interface:** custom tools written with `fetch` against the official REST API at `https://api.dailybot.com/v1/`, following the developer docs at https://www.dailybot.com/developers/api. Dailybot does not publish a public OpenAPI document (the Swagger/OpenAPI endpoints on `api.dailybot.com` require an API key), so the tools are hand-written. Endpoints whose request bodies are not documented in detail (check-in creation, forms, labels, workflows, webhooks, email) take a free-form `body` object that is sent as is. Every mutation requires approval.

**Auth:** API key, sent as the `X-API-KEY` header. Create one in Dailybot under Settings, Integrations, API keys (https://app.dailybot.com/settings/integrations/api-keys). API keys need a paid Dailybot plan and act with the role of the key's owner, so admin-only tools (organization kudos, creating check-ins and forms) need an admin or manager key. Dailybot's OAuth2 endpoints are limited to select integrations that hold a Dailybot OAuth client, so there is no OAuth option.

**Known gaps:** no OAuth; Plan (beta), agent, CLI and commands-platform endpoints are not covered; the health check calls `GET /v1/me/`.
