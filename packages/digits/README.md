# Digits

Digits is AI-powered accounting software built around an agentic general ledger. This package exposes Digits' official remote MCP server (`https://api.digits.com/mcp`, streamable HTTP) so agents can use the tools Digits publishes for its ledger.

Interface: MCP. Digits' public OpenAPI document (`https://digits.com/openapi.json`) only describes marketing-site files (llms.txt, sitemap, MCP discovery), and the Connect REST API (`https://connect.digits.com/v1`) has no public spec, so MCP is the only official, complete surface. Tools that are not marked read-only require approval.

Auth: OAuth 2.0 with dynamic client registration, discovered from `https://api.digits.com/.well-known/oauth-authorization-server` (PKCE S256). The user signs in to Digits when connecting; no key or OAuth app needs to be created. Add Executor's redirect URI if Digits asks for one.

Known gaps: the Connect REST API (OAuth at `connect.digits.com`, needs a partner-registered client) is not included. Tools are discovered at runtime, so the count is not fixed.
