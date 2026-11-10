# Check

Check is a payroll API for platforms. This package exposes Check's tools (companies, employees, contractors, payrolls, taxes, benefits, forms, webhooks and more) through Check's official hosted MCP server, documented at https://docs.checkhq.com/docs/hosted-remote. Check publishes no stable public OpenAPI document, so MCP is the interface. Mutations (anything not marked read-only) require approval.

Auth:

- Production API key: create it in Check Console and use it with `https://mcp.checkhq.com/check/mcp`.
- Sandbox API key: a separate key from the sandbox Console, used with `https://mcp.sandbox.checkhq.com/check/mcp`. A key is not valid across environments.
- OAuth: sign in with a Check Console login (production). The server publishes OAuth metadata and dynamic client registration, so no OAuth app needs to be created. Redirect URI is Executor's standard callback.

Known gaps: OAuth targets production only; use a sandbox API key for the sandbox. An API key acts as the whole partner account, so prefer a dedicated key. Check's server also supports `?read_only=true`, which this package does not set.
