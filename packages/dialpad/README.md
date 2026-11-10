# Dialpad

Covers the Dialpad Admin API v2: calls and call routing, SMS, users, offices, departments, call centers, contacts, phone numbers, transcripts, webhooks and event subscriptions, and stats. 247 tools, all mutations require approval.

## Interface

OpenAPI, from Dialpad's own OpenAPI 3.1 specification (Admin API v2):
`https://dialpad.com/static/openapi/platform-v1.0.json`. Requests go to `https://dialpad.com/api/v2`. (Sandbox accounts use `sandbox.dialpad.com`, which this package does not target.)

## Auth

- **API key** (`apiKey`): create one in the Dialpad admin web portal (Admin Settings, API Keys). Many endpoints require a company admin key. Sent as a bearer token.
- **OAuth 2.0** (`oauth`): authorization code flow against `https://dialpad.com/oauth2/authorize` and `https://dialpad.com/oauth2/token`, requesting `offline_access` for refresh tokens. Dialpad publishes no discovery metadata and no dynamic registration, so the connect page asks for the client id and secret of an OAuth app you registered with Dialpad ([docs](https://developers.dialpad.com/docs/oauth)). Add Executor's redirect URI to the app. Additional API scopes must be approved by Dialpad for your app.

## Known gaps

- The sandbox environment is not targeted.
- The health check calls `GET /api/v2/company`, which accepts any valid user credential. Its response fields are all nullable, so the check only confirms a successful JSON response.
- Websocket event subscriptions are not tools.
