# Autosana

Autosana runs AI-driven end-to-end tests for mobile and web apps. This package covers flows, suites, hooks, apps, devices, environments, workspaces, and flow, suite and hook run results (about 30 tools).

Interface: Autosana's official remote MCP server at `https://mcp.autosana.ai/mcp` (docs: https://docs.autosana.ai/mcp-setup.md). Autosana publishes no OpenAPI document. Tools that change data ask for approval; tools the server marks read-only do not.

Auth:

- API key: create one in the Autosana dashboard for your workspace and paste it when connecting. It is sent as `x-api-key`, and always acts in the workspace it was created in.
- OAuth: browser sign-in. The server advertises dynamic client registration, so Executor registers its own client; no OAuth app to create. Use this to switch workspaces.

Known gaps: the REST API at `backend.autosana.ai/api` (labels, env vars, members, app build upload) is documented at https://docs.autosana.ai/api-reference.md but not mounted; only the MCP tools are exposed. The MCP server was probed without credentials only; no account was connected.
