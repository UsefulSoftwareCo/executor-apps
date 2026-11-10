# Fathom

Fathom is an AI meeting assistant. This package exposes meetings, summaries, transcripts, recording downloads, teams, team members, users, meeting types and webhook management (create and delete).

Interface: OpenAPI, from Fathom's official document at https://developers.fathom.ai/api-reference/openapi.yaml (server https://api.fathom.ai/external/v1). Mutations require approval.

Auth:

- API key: create one in Fathom under Settings, API Access (https://developers.fathom.ai/quickstart). Sent in the `X-Api-Key` header.
- OAuth 2.0: register an OAuth app at https://fathom.video/marketplace_applications/new and enter its client id and secret on the connect page. Authorize URL `https://fathom.video/external/v1/oauth2/authorize`, token URL `https://fathom.video/external/v1/oauth2/token` (the host used by Fathom's official TypeScript SDK; api.fathom.ai also answers but the SDK is the reference), single scope `public_api`, client credentials in the form body. PKCE: Fathom's docs and SDK never send code_challenge; the framework types only list it as a host-owned reserved parameter, so whether Executor sends it for a declared authorizationUrl could not be confirmed without a live connect. A conforming server ignores an unused challenge. Add Executor's redirect URI to the app's registered redirects. Refresh tokens are single-use and rotate.

Known gaps: Fathom also runs an official OAuth MCP server (https://api.fathom.ai/mcp) which is not used here: it is a separate OAuth system (dynamic client registration, PKCE S256, scope mcp) whose tool list cannot be read without an authorized connection, while the OpenAPI document covers 11 operations including webhook creation/deletion and recording downloads that an MCP surface is not known to expose. The `newMeeting` webhook payload definition in the spec is not a callable tool. API keys are per user, so they only see that user's and their team's recordings.
