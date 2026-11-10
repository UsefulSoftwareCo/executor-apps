# Contentful

Manage a Contentful space from an agent: spaces and environments, content types, entries, assets, locales, tags and releases, through Contentful's own tools. The `graphql` group also reads a space's delivered content through its generated GraphQL Content API.

## Interface

Contentful's hosted remote MCP server, `https://mcp.contentful.com/mcp` (global) and `https://mcp.eu.contentful.com/mcp` (EU), documented at https://www.contentful.com/developers/docs/tools/mcp-server/. Tools are discovered live from the server and are grouped under `us` and `eu`; no tool count is asserted because none was verified against a connected account. The tool categories documented in Contentful's MCP server repository (https://github.com/contentful/contentful-mcp-server) are context, content types, entries (including semantic search and snapshots), assets, spaces and environments, content preview, locales, releases, tags, AI actions and usage; the hosted server may expose a different subset. Tools without `readOnlyHint` require approval.

Contentful publishes no official OpenAPI document for the Content Management API, so the MCP server is the interface.
### GraphQL Content API

Mounted under `graphql`, from Contentful's official GraphQL Content API, `https://graphql.contentful.com/content/v1/spaces/{space}/environments/{environment}` (docs: https://www.contentful.com/developers/docs/references/graphql/). The schema is generated per space and environment from its content model and discovered live by introspection after connecting, so each content type gets its own queries. The API is read-only; any mutation tool that appeared would require approval. No tool count is asserted because the schema depends on the space. Use it to read delivered content; use `us`/`eu` to manage it.

## Auth

The `us` and `eu` groups use OAuth 2.1, using the server's published authorization-server metadata (dynamic client registration, PKCE S256, no scopes; checked at `/.well-known/oauth-authorization-server` on both hosts). Connect the `Contentful` account for the global region or `Contentful (EU)` for the EU region, sign in to Contentful and choose the spaces and environments to expose. Dynamic registration means there is no OAuth app to create, so no redirect URI to configure.

The `graphql` group uses the `Content Delivery or Preview API token (GraphQL)` method on the `Contentful` provider. In the Contentful web app open Settings > API keys, create a key, and copy the Content Delivery API access token (published content) or the Content Preview API access token. Enter the space ID, the environment ID (usually `master`) and the token when connecting; the token is sent as `Authorization: Bearer <token>` to `graphql.contentful.com`. A preview token only returns drafts when the query passes `preview: true` (for example `blogPostCollection(preview: true) { items { title } }`); without it, queries return published content. Contentful offers no OAuth flow for the GraphQL Content API (its OAuth apps issue Content Management API tokens), so none is declared for it. One connected token account is one space and environment; connect again for others.

## Known gaps

- Unverified against the vendor page: the vendor documentation page returned HTTP 429 (a bot checkpoint) on every fetch, so these are not confirmed from it: whether the MCP app must be installed per space and environment, whether the hosted server is generally available, and whether it offers any token method besides OAuth. The package assumes OAuth only.
- No API key / personal access token method is offered. Contentful's repository documents a CMA personal access token (`CONTENTFUL_MANAGEMENT_ACCESS_TOKEN`) only for the locally run `@contentful/mcp-server` (https://github.com/contentful/contentful-mcp-server), which is not what this package connects to.
- The Content Delivery REST, Content Preview REST, SCIM and Images APIs are not exposed (GraphQL is, under `graphql`).
- GraphQL, folded in from a former separate package: the vendor docs (contentful.com/developers) returned HTTP 429 on every fetch, so the endpoint, Bearer header, token types, `preview: true` behavior, introspection availability to delivery/preview tokens and the absence of OAuth for GraphQL are not confirmed against them. The endpoint answers unauthenticated POSTs with ACCESS_TOKEN_MISSING, confirming host and path. The health check uses `{ __typename }` so it does not need introspection; tool discovery does. Introspection and the GraphQL tool list were not exercised (no real account).
