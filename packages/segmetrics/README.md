# SegMetrics

Query SegMetrics marketing analytics (saved reports, customer journeys and attribution data) from Executor.

Interface: SegMetrics' official remote MCP server at `https://app.segmetrics.io/mcp` (read-only, per SegMetrics). The server publishes OAuth metadata and dynamic client registration, so the package uses `oauth2({ discover })` with scopes `mcp:tools` and `mcp:resources`. Tools are listed from the server at runtime; any tool without `readOnlyHint` asks for approval.

Auth: OAuth only. Connect an account and approve access in SegMetrics; no OAuth app needs to be created by hand. Redirect URI is registered automatically through dynamic client registration.

Known gaps: SegMetrics also offers an API-key REST API (Reporting API at `api.segmetrics.io`, Import API at `import.segmetrics.io`, documented at https://developers.segmetrics.io/) but publishes no OpenAPI document, so it is not wrapped here. Data import (contacts, orders, ad performance) is therefore not available.
