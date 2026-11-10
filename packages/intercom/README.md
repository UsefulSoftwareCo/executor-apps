# Intercom

Contacts, companies, conversations, tickets, messages, articles, help center, data events, notes, tags, teams and the rest of the Intercom REST API (235 tools).

**Interface:** OpenAPI. Intercom's official description, API version 2.16, at
https://raw.githubusercontent.com/intercom/Intercom-OpenAPI/main/descriptions/2.16/api.intercom.io.yaml
(repository https://github.com/intercom/Intercom-OpenAPI). Every mutation requires approval. Read-only POST operations (contact, conversation, ticket and activity log search, company and call listing) are queries and do not.

## Auth

- **Access token** (`token`): create an app in the Intercom Developer Hub (https://app.intercom.com/a/apps/_/developer-hub), set its permissions, and copy the access token from Authentication. Also enter the workspace data region: `us`, `eu` or `au`.
- **OAuth** (`oauth`): create an app in the Developer Hub, enable OAuth, and set the redirect URI to the one Executor's connect page shows. Enter the app's client ID and secret. Intercom grants scopes from the app's permissions, not from the authorize request.

## Known gaps

- OAuth uses the US authorize host (`app.intercom.com/oauth`) and token host (`api.intercom.io`). Intercom also documents `app.eu.intercom.com` and `app.au.intercom.com` authorize hosts, but sending EU or AU users to the US host works: they pick their region from a dropdown on the sign-in page. Intercom documents only `api.intercom.io` for the token exchange. API calls from OAuth accounts go to `api.intercom.io`, which routes to the workspace's region. Use an access token with the region set to call a regional host directly.
- Intercom publishes an official remote MCP server (`https://mcp.intercom.com/mcp`, EU `https://mcp.eu.intercom.com/mcp`, AU not supported). It is not used here because the OpenAPI document exposes far more operations.
