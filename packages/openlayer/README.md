# Openlayer

Covers the Openlayer AI quality platform: workspaces, projects, inference pipelines (monitoring and trace publishing), tests and test results, commits and versions, governance frameworks and rules, webhooks, and integrations.

**Interface:** OpenAPI, the backend's own document at https://api.openlayer.com/v1/openapi.json (base URL `https://api.openlayer.com/v1`). The document is large and also describes internal and login endpoints; only operations whose security lists the spec's `apiKey` scheme (plus public operations) are exposed. Login, MFA, token, SSO, cli-auth, OAuth2-server and password-reset paths are removed. 147 tools (84 mutations, each requiring approval). 344 operations are skipped by the compiler (282 need another auth scheme, 61 unresolved schema references, 1 external reference). Operations that require only the session-JWT `bearerAuth` scheme are skipped because the vendor does not document that API keys are accepted there. Openlayer also runs a remote MCP server (https://mcp.openlayer.com/mcp), but it is OAuth-only and bound to one workspace, so it is not used here.

**Auth:** API key. In the Openlayer app, click your user icon, choose "API Keys", then "Create API key" (https://docs.openlayer.com/workspace-and-projects/find-your-api-key). The key is sent as `Authorization: Bearer <key>`. User-created OAuth apps for the REST API are not documented.

**Gaps:** Self-hosted Openlayer instances use a different host and are not supported. File upload operations that need presigned storage are not specially handled.

**Icon:** official mark from https://www.openlayer.com/figma/logo-openlayer.svg.
