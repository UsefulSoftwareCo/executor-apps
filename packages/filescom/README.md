# Files.com

Files.com cloud file storage and managed file transfer: files and folders (find, list, copy, move, delete, zip), share links (bundles) and recipients, users, groups, permissions, automations, remote servers and the audit and activity logs.

**Interface.** Files.com's official hosted remote MCP server, `https://<site>.files.com/api/ai/mcp/v1/` (docs: https://www.files.com/docs/integrations/model-context-protocol-mcp-server). Files.com publishes no OpenAPI document (its SDKs are generated from an internal schema), so the MCP server is the best official interface. Tools are listed by the server, so the exact set depends on the site; mutations require approval, read-only tools do not.

**Auth.** API key only. Create one in your site under Account > API Keys (a user key acts with that user's permissions; use a limited key where possible). Executor asks for the site name (the `mycompany` of `mycompany.files.com`) and the key, which is sent as the `X-FilesAPI-Key` header.

**Known gaps.**
- The hosted server also offers OAuth ("Sign in with Files.com"), but its metadata and endpoints are per site and Executor's static OAuth declaration cannot express that, so OAuth is not offered.
- Sites on a custom domain are not supported; credentials are only sent to `*.files.com`.
- Tool count was not probed against a live site (no credentials); the server's documented tool categories are file system, automations, remote servers, sharing, users and groups, and about 20 log tools.
