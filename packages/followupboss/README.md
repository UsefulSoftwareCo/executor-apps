# Follow Up Boss

Follow Up Boss is a CRM for real estate teams. This package exposes its REST API as 125 tools (62 of them mutations, each requiring approval): people, events, notes, tasks, calls, text messages, appointments, deals, pipelines and stages, action plans, automations, smart lists, ponds, groups, teams, users, custom fields, templates, webhooks, email-marketing campaigns and events, and inbox apps.

## Interface

OpenAPI. Follow Up Boss publishes no combined OpenAPI file; every endpoint page on https://docs.followupboss.com/reference/ embeds its own OpenAPI 3.1 definition. `document.json` is those official definitions merged into one document (server `https://api.followupboss.com/v1`). Three changes were made while merging: the `X-System` and `X-System-Key` header parameters were dropped, three mistyped paths were corrected (`//textMessageTemplates`, `/v1/rateLimit/*`, `/webhookEvents/:id`), and path parameters the definitions leave undeclared were added.

## Auth

- API key: in Follow Up Boss open Admin, then API, and copy the key. It is sent as the HTTP Basic username with an empty password. The key has the access level of the user who owns it (an agent's key sees only that agent's people; webhooks need an owner key).

## Known gaps

- OAuth is not offered. Follow Up Boss OAuth clients can only be created by a registered system through `POST /v1/oauthApps` with `X-System` and `X-System-Key` headers, and the authorize URL requires `response_type=auth_code`, which Executor reserves and always sends as `code`.
- Follow Up Boss asks every API user to register a system, and says every request should carry the registered `X-System` and `X-System-Key` headers. Registration is requested for general use and mandatory for services provided to Follow Up Boss customers. Executor does not send these headers, so requests are not attributed to a registered system; whether omitting them causes problems beyond the lower rate limits below is untested. The `/rateLimit/*` endpoints authenticate with `X-System`/`X-System-Key`, which this package does not send, so they will fail.
- Rate limits are enforced per sliding 10 second window. Without a valid `X-System-Key` (this package's case) the limits are 125 requests globally and 10 for `GET /events`. Registering a system and sending `X-System-Key` raises them to 250 and 20.
