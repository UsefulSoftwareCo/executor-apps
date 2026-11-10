# Factorial

Employees, time off, time tracking, contracts, payroll, recruiting, documents, expenses, custom fields and the rest of the Factorial HR public API (615 tools, 299 of them mutations that require approval).

**Interface:** OpenAPI. Factorial's own document, the one its official SDKs are generated from, at https://api.factorialhr.com/oas (version 2026-10-01). Its paths are date-versioned, so tools track that version.

**Auth**

- API key (`x-api-key`): an admin creates it in Factorial under Settings > API Keys. It grants company-wide access and does not expire.
- OAuth 2: an admin registers an application in Factorial under Settings > Advanced configuration > OAuth applications, picks scopes and a redirect URI (use the one Executor shows on the connect page), then enters the client id and secret. Authorization is at `https://id.factorialhr.com/oauth/authorize`, tokens at `https://id.factorialhr.com/api/oauth/token`. The requested scopes must be enabled on the OAuth application.

**Known gaps:** production environment only (`api.factorialhr.com`); the demo environments (`api.eu2.demo.factorial.dev`) are not supported. Factorial also runs an official remote MCP server at https://mcp.factorialhr.com (user-scoped OAuth with dynamic registration); it is not mounted because the OpenAPI tools cover the API more broadly.
