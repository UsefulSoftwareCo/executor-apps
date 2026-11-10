# Okta

Covers the Okta Admin Management API for an org: users, groups, applications, policies, authorization servers, authenticators, factors, network zones, roles, system logs, event hooks, and the rest of the admin API, 731 tools in all (442 mutations, each requiring approval).

Interface: OpenAPI 3.0, Okta's official Management API document from https://github.com/okta/okta-management-openapi-spec (`dist/current/management-minimal.yaml`). The document's server is `https://{yourOktaDomain}`, so each account's own domain is used as the base URL, and credentials are only sent to that origin.

Auth: two methods, both asking for the org domain (for example `example.okta.com`).
- API token: in the Admin Console open Security > API > Tokens and create a token; it is sent as `Authorization: SSWS <token>` and carries the creating admin's permissions.
- OAuth access token: paste an OAuth 2.0 access token carrying `okta.*` scopes (for example one minted by an API Services app with `private_key_jwt` client credentials), sent as `Authorization: Bearer <token>`.

The provider's `hosts` limit credentials to `*.okta.com`, `*.oktapreview.com`, `*.okta-emea.com`, `*.okta-gov.com`, `*.okta.mil` and `*.trex-govcloud.com`. The account check calls `GET /api/v1/users?limit=1`; a 403 is treated as a valid credential without user scopes.

Known gaps: the framework's `oauth2` method cannot target a per-org authorization server, so the authorization-code flow and automatic client-credentials token minting are not offered; refresh the access token yourself. Custom domains are not supported; use the org's Okta-provided domain. Okta's MCP server is a local stdio server configured with an API token, not a remote one, so it is not mounted.
