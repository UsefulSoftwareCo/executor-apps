# LiveSwitch

Covers the LiveSwitch Public API: contacts, conversations, projects, recordings, documents, forms, webhooks, tags, attributes and attribute groups, accounts, organization settings, Sparks and Spark templates (79 tools, 35 mutations, all mutations require approval).

Interface: OpenAPI, loaded live from the vendor's own document at https://public-api.production.liveswitch.com/swagger/v1/swagger.json. API docs: https://developer.liveswitch.com.

Auth: OAuth 2.0 authorization code with refresh tokens. LiveSwitch has no self-serve developer console: email integrations@liveswitch.com with the subject "Create a developer app", giving your callback URL (the Executor OAuth redirect URI shown on the connect page must be whitelisted) to receive a client id and secret. Enter them on the connect page. Authorization goes to https://id.liveswitch.com/authorize with `audience=https://public-api.production.liveswitch.com/`, and the token endpoint takes a JSON body. Scopes requested cover every tool; a developer app may be limited to fewer.

Known gaps: no API-key method exists. The spec's `/v1/tokens` helper endpoints are included but are not needed with Executor's OAuth.
