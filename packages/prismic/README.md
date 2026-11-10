# Prismic

Search and read Prismic documents, create and edit content as drafts in releases, upload assets and publish releases in a Prismic repository.

**Interface:** Prismic's official hosted remote MCP server, `https://mcp.prismic.io/mcp` (docs: https://prismic.io/docs/mcp). Tools are discovered from the server at runtime; tools that are not read-only require approval. The public Content API (`<repo>.cdn.prismic.io/api/v2`) is per-repository and the Types/Asset/Migration APIs publish no OpenAPI document, so they are not used.

**Auth:** OAuth only. The server publishes protected-resource metadata and supports dynamic client registration, so Executor discovers everything from the URL and the redirect URI is registered automatically. Before connecting, activate Prismic MCP for each repository in Settings > Prismic MCP (environments are activated separately). There is no API key method for the MCP server.

**Known gaps:** No tool list is published, so the count depends on the server. Content API access with a repository access token and the Custom Types API are not exposed.

Icon: Simple Icons `prismic`.
