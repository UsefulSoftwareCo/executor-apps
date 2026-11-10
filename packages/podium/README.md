# Podium

Podium customer messaging: contacts and tags, conversations and messages, templates, campaigns, reviews and review invites, appointments, invoices, payments and refunds, phone calls, products, feedback, locations, users and webhooks. 94 tools from Podium's official Platform API (version 2021.4.1), base URL `https://api.podium.com`.

## Interface

OpenAPI. Podium publishes no downloadable OpenAPI file; its ReadMe developer docs (https://docs.podium.com/reference) embed one OpenAPI document per operation. `podium.json` is those official documents merged into one, unchanged otherwise, and `openapi.ts` mounts it. All 94 operations compile; mutations require approval. The SCIM user and workflow operations are not in the docs' embedded documents and are not included.

## Auth

OAuth 2 only; the Podium API has no personal API key. Register an app in the Podium developer portal (https://developer.podium.com); Podium issues a client id and secret and asks for your redirect URI, which must be HTTPS and match the one Executor shows on the connect page. Authorization is at `https://api.podium.com/oauth/authorize`, tokens at `https://api.podium.com/oauth/token` (JSON body, client credentials in the body). Access tokens last 10 hours and are refreshed with the refresh token. Scopes are space separated and cover each tool's `read_*` or `write_*` scope.

## Known gaps

The `podium-version` header is optional and not sent. The docs list no endpoint to read the authorizing user, so the health check lists one location.

## OAuth scopes

The default scope list is the 17 scopes on Podium's official scopes page (https://docs.podium.com/docs/oauth-scopes), including `write_data_feed_event`. Some per-operation docs name scopes that page does not list: `read_appointments`, `write_campaigns`, `read_phones`, `read_products`, `write_products`, `read_templates`, `write_templates`, `write_writebacks` and `write_integration_runtime`. They are left out of the default request because an unrecognised scope can make Podium reject authorization. Operations that need them (appointments reads, phone/voicemail, products, templates, campaign writes, writebacks, integration heartbeat) may return 403 until Podium enables those scopes for the app.
