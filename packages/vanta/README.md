# Vanta

Controls, tests, documents, policies, vendors, people, risk scenarios, vulnerabilities, integrations and resources in a Vanta compliance tenant.

**Interface:** OpenAPI, Vanta's official Manage Vanta API document at https://developer.vanta.com/reference/manage-vanta.json (commercial server `https://api.vanta.com/v1`).

**Auth:** client credentials. Vanta does not offer API keys, and user-created OAuth apps for the Manage Vanta API use only the client-credentials grant, so there is no browser OAuth flow. Create a "Manage Vanta" application in the Vanta Developer Console (https://app.vanta.com/settings/developer), then enter its client ID, client secret and the space-separated scopes it was granted (for example `vanta-api.all:read vanta-api.all:write`). The package exchanges them at `https://api.vanta.com/oauth/token` for a one-hour bearer token and refreshes it as needed. Vanta allows one active token per application, so do not share one application between several consumers: minting a token elsewhere revokes this one. The package shares one cached token per application, and on a 401 it mints a new token and retries once.

**Gaps:** the Build Integrations API (a different application type that pushes data into Vanta) and the Auditor API (auditor-firm applications) are not mounted, and neither is Vanta Gov (`api.vanta-gov.com`). Vanta also runs an official remote MCP server (`https://mcp.vanta.com/mcp`) that requires an interactive admin sign-in; the OpenAPI tools cover the API more broadly.
