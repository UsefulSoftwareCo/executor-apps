# Sourcegraph

Code search, repositories, commits, symbols, users, batch changes, search contexts and the rest of Sourcegraph's GraphQL API. Tools are generated from the instance's GraphQL schema at runtime; every mutation asks for approval.

Interface: the official GraphQL API at `https://<instance>/.api/graphql` (https://sourcegraph.com/docs/api/graphql). Sourcegraph documents this endpoint as a debug API with no backwards-compatibility guarantees, so operations may change or disappear. The streaming search API and the newer HTTP external API (https://sourcegraph.com/api-reference) are not wrapped; no OpenAPI or Swagger document was found for the external API (the page is a rendered reference and the usual spec paths return 404), so GraphQL is used.

Auth:

- Access token. Create one in Sourcegraph under User settings > Access tokens, and enter it with your instance host (`sourcegraph.com` or `<name>.sourcegraph.com`). Credentials are sent as `Authorization: token <token>`.
- OAuth is not offered. Per https://sourcegraph.com/docs/admin/oauth-apps, OAuth clients (authorize `/.auth/idp/oauth/authorize`, token `/.auth/idp/oauth/token`, scope `user:all` for GraphQL) are created by instance administrators under Administration > OAuth clients; the only self-service registration is Dynamic Client Registration, limited to the `mcp` scope. The docs do not describe a way for ordinary users, or for this package, to obtain a client on sourcegraph.com, so a token is used.
- The instance field is free text, so an invalid host is only rejected after saving, when health or a tool call runs; no credential is sent in that case.

Known gaps:

- Only Sourcegraph Cloud hosts (`*.sourcegraph.com`) are allowed. Self-hosted instances live on arbitrary domains, and a package must declare the hosts credentials may reach, so they are not supported.
- Sourcegraph also runs an official MCP server at `https://sourcegraph.com/.api/mcp` (OAuth with dynamic registration); it is not used because GraphQL exposes more operations.
