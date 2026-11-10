# Builder.io

Builder.io CMS content and Builder Code (visual development) through Builder's official remote MCP servers, mounted as two groups: `cms` and `code`.

Interface: MCP. `cms` is https://mcp.builder.io/mcp/publish (models, schemas and content of a Builder Content or Hybrid space; docs: https://www.builder.io/c/docs/mcp-builder-server). `code` is https://mcp.builder.io/mcp/fusion (projects, branches, agent runs, message history, design systems; docs: https://www.builder.io/c/docs/fusion-mcp-server). Builder publishes no OpenAPI document, so MCP gives the broadest official tool surface.

Auth: two methods.
- OAuth 2.0 (accounts `cms` and `code`): dynamic client registration and PKCE, discovered from each server's metadata. Each sign-in asks you to pick the space (cms) or organization (code), and each token is scoped to that one. No redirect URI setup or manual OAuth app is needed.
- Private key (account `rest`): a Space admin creates a private key in Builder under Space Settings > Private Keys (docs: https://www.builder.io/c/docs/using-your-api-key). Enter it together with the Space's Public API Key (Space Settings, or Cmd/Ctrl+K and type "API"). Sent as `Authorization: Bearer <private key>` (header documented at https://www.builder.io/c/docs/write-api). Hosts: builder.io and cdn.builder.io.

The `rest` group is hand-written, not an official spec: `listContent` (Content API, https://cdn.builder.io/api/v3/content/{model}), and `createEntry`, `updateEntry`, `deleteEntry` (Write API, https://builder.io/api/v1/write/{model}); mutations require approval. Health is a one-entry Content API read. The private-key path was not exercised against a live account.

Known gaps: the Admin GraphQL API and the Upload API are not exposed except as far as the MCP servers cover them; `rest` covers only entry list/create/update/delete. Tool lists are whatever the servers expose at connection time.
