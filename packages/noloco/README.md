# Noloco

Work with Noloco no-code apps and portals from an agent: list projects and tables, read schemas, and list, get, create, update and delete records. Two interfaces are mounted in one router, `mcp` and `graphql`.

## Interface

`mcp`: Noloco's official remote MCP server, `https://api.core.noloco.io/mcp`, documented at https://guides.noloco.io/quickstart/connect-an-ai-agent.md and https://guides.noloco.io/settings/mcp-integration.md. Per those docs its tools list projects and tables, read schemas, and list/get/create/update/delete records. Tools are discovered live; no tool count is asserted (no real account was connected). Tools without `readOnlyHint` require approval. One connection covers every app where you are a data admin and that you approve at sign-in. The probe (`scripts/mcp-probe.ts`) confirmed OAuth metadata with dynamic client registration, PKCE S256 and scopes `mcp:read`/`mcp:write`.

`graphql`: each app's own generated GraphQL API, `https://api.portals.noloco.io/data/<app_name>` (https://guides.noloco.io/api-documentation/api-overview.md). The schema is per app and discovered live by introspection after connecting. Every mutation requires approval.

## Auth

- OAuth (`mcp`): uses the server's published metadata with dynamic client registration, so there is no OAuth app to create and no redirect URI to configure. Sign in to Noloco and choose the apps and read or read+write access.
- App API key (`graphql`): in the Noloco app open Settings > API & Integrations and copy the API key. Enter the app name (as it appears in the API URL) and the key; it is sent as `Authorization: Bearer <key>` to `api.portals.noloco.io`. One account is one app; connect again for others.

## Known gaps

- Neither interface was exercised with a real account. The GraphQL health check uses `{ __typename }`; tool discovery needs introspection to be enabled for the key.
- The MCP server cannot create tables, pages, views or workflows, or change design, settings, billing or users (per Noloco's docs).
- Icon is Noloco's official 256px app icon (Logo-WebClip.png from noloco.io).