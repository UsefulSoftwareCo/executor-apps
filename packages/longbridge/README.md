# Longbridge

Real-time and historical market data, fundamentals and research, derivatives, account and portfolio data, order placement, price alerts and scheduled investment plans in Longbridge. This package also covers the catalog target "Longbridge MCP".

## Interface

Longbridge's official remote MCP server (Streamable HTTP), documented at https://open.longbridge.com/docs/mcp: `https://mcp.longbridge.com`. Tools are discovered from the server (about 160) and depend on region, account level and granted scopes. Tools not marked read-only (trading, alerts, plans) require approval.

## Auth

OAuth 2.1 with dynamic client registration (`discover` on the MCP URL); no client to create. Redirect URI: whatever the Executor connect page shows. Access can be revoked in Longbridge account security settings. No API-key method: the MCP server only accepts OAuth.

## Known gaps

- Longbridge SG/HK (AP) accounts may be faster on `https://mcp.longbridge.cn`; US accounts must use the global endpoint (`https://mcp.longbridge.com`), which this package uses.
- The official OpenAPI (`openapi.yaml` in github.com/longbridge/developers, 33 paths) is less complete than the MCP server, so this package uses the MCP server.
- The no-browser `/agent` Agent Auth Code fallback is not supported.
- The icon is Longbridge's official app icon PNG (no SVG published).
