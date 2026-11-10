# MarcoPolo

MarcoPolo is an AI data runtime that lets agents query, correlate and analyze authorized data across databases, warehouses, cloud storage and SaaS applications. This package mounts MarcoPolo's official remote MCP server (`https://mcp.marcopolo.dev`, streamable HTTP) and exposes whatever tools it lists for the signed-in workspace.

Auth: OAuth only. The server publishes protected-resource metadata and an authorization server (WorkOS AuthKit) with dynamic client registration, so there is no OAuth app to create; sign in when connecting. Executor's redirect URI is registered automatically through DCR. MarcoPolo also documents workspace API tokens, but the header format is not published, so they are not offered.

Approvals: every tool that is not marked `readOnlyHint` requires approval.

Known gaps: the tool list depends on the connected workspace and cannot be enumerated without credentials; it was verified only by the MCP probe (401 with OAuth discovery), typecheck and deploy. The icon is the app icon from marcopolo.dev (the site publishes no SVG).
