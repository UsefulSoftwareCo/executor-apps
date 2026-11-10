# Clerk

Manage a Clerk instance: users, organizations and memberships, invitations, sessions, allow/block lists, domains, JWT templates, OAuth applications, SAML and instance settings.

Interface: OpenAPI, Clerk's official Backend API specification, versioned (2026-05-12) at https://raw.githubusercontent.com/clerk/openapi-specs/main/bapi/2026-05-12.yml (repository https://github.com/clerk/openapi-specs). Requests go to https://api.clerk.com/v1.

Auth: secret key (`apiKey`). Create it in the Clerk Dashboard under API keys; it starts with `sk_test_` or `sk_live_` and is sent as a bearer token. A key belongs to one instance (development or production); add one account per instance. Clerk's Backend API has no user-created OAuth app flow, so OAuth is not offered.

Known gaps: only the Backend API is covered. The Frontend API (browser-oriented), the Platform API (beta) and Clerk's MCP server (https://mcp.clerk.com/mcp, for docs and SDK snippets) are not mounted. The health check calls `GET /users/count`. Every mutation requires approval.

Note: 2026-05-12 is Clerk's latest published API version. It is a breaking version: user, organization and /me update endpoints no longer accept metadata fields, which are written through the dedicated metadata endpoints instead.
