# Nooks

Covers the Nooks Sequencing API: sequences and steps, sequence enrollments (states), prospects, accounts, calls and dispositions, emails and templates, tasks, notes, tags, mailboxes, users and opportunities.

**Interface:** OpenAPI 3.1, Nooks' official document at https://developer.nooks.in/openapi.yml (API base `https://partner-api.nooks.in/v1`).

**Auth**
- API key: create one on the API Keys page under Developer Settings in your Nooks workspace (prefix `nooks-api-`; full read/write within the workspace). Sent as a bearer token.
- OAuth 2.0 (authorization code + PKCE) via `https://oauth.nooks.in`, discovered from its RFC 8414 metadata. Register your own OAuth app with Nooks and enter its client id and secret on the connect page; register Executor's redirect URI as the app's redirect URI. Access tokens last one hour and refresh tokens rotate.

**Known gaps:** The SCIM provisioning endpoints are not part of the published OpenAPI document. Nooks also offers a remote MCP server, not used here because the OpenAPI covers the API directly.
