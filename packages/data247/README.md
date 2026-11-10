# data247

Data lookup services from Data247: carrier and line-type lookup, phone and email
verification, reverse phone/email, phone-to-name and find-by-name-and-address,
address and ZIP verification, property records, consumer profile and gender
append, National DNC checks and internal DNC list management, IP geolocation
with proxy/VPN/threat signals, signup fraud screening, one-call lead validation,
and free account tools (balance, rate card, usage). Lookups are billed against
the account's prepaid balance at the normal API rates.

Interface: Data247's official remote MCP server, `https://mcp.data247.com`
(https://www.data247.com/connectors). Data247 has a REST API
(`https://api.data247.com/v3.0?key=...&api=<code>`, manual at
https://www.data247.com/api_user_manual) but publishes no OpenAPI document, so
the MCP server is used. Tools are whatever the server lists for the account.

Auth:

- OAuth (`oauth`): the only method this package offers. The MCP server's 401 challenge advertises OAuth only and the vendor's connector page (https://www.data247.com/connectors) describes OAuth sign-in, not an API key. A bearer REST key was not tested against the MCP server (no credentials were used). It publishes OAuth
  metadata (WorkOS AuthKit) with dynamic client registration and PKCE, so
  Executor registers its own client and the user signs in with their Data247
  account in the browser. Scopes: `openid`, `email`, `offline_access`. Create an
  account at https://www.data247.com/register/main; access can be revoked from
  the MCP Access page in the Data247 portal. If registration is refused, use
  Executor's redirect URI shown on the connect page.

Approvals: every tool the server does not mark read-only asks for approval.

Hosts: only `mcp.data247.com` is declared. The OAuth authorization server
(`whimsical-chalice-52.authkit.app`) is reached by the host for discovery,
registration and token exchange (OAuth clients are host-owned per the framework's
provider contract); the app only ever sends the access token to the MCP host.

Known gaps: Data247's REST key (`api.data247.com/v3.0?key=...`) is a separate
interface with no published OpenAPI document and is not wrapped here; accounts
that only have a REST key cannot connect through this package. This is an
accepted exception to the offer-every-method rule because the vendor's MCP
documents OAuth only. Account health only verifies the token reaches the MCP
server. The tool list was not read live (the server requires sign-in).

Icon: the clock mark is cropped from the vendor's 2x site logo
(https://www.data247.com/img/logo-2x.png, 545x132; the clock is about 140x132 px).
Data247 publishes no SVG or press kit. The dark variant inverts only the neutral
black/gray pixels, so the orange-red hand keeps its color.
