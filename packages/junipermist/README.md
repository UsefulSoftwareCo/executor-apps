# Juniper Mist

Juniper Mist cloud-managed networking: organizations, sites, access points, switches, WAN edges, clients, WLANs, alarms, inventory, and the rest of the Mist REST API.

**Interface:** OpenAPI. Tools are generated from Juniper's official Mist OpenAPI 3.1 document, `https://raw.githubusercontent.com/mistsys/mist_openapi/master/mist.openapi.json` (maintained by Juniper at https://github.com/mistsys/mist_openapi). Juniper describes it as mainly for documentation, so a few operations may drift from the live API. Every mutation asks for approval.

**Auth:** API token. Create it in the Mist portal under your profile (a user token has that admin's privileges) or under Organization > Settings > API Token (an org token with scoped privileges). Enter the token and the API host for your cloud region (for example `api.mist.com`, `api.eu.mist.com`, `api.gc1.mist.com`; the Mist portal's region determines it). Sent as `Authorization: Token <token>`. Mist has no user-registered OAuth apps, so there is no OAuth method; session login (CSRF token) is not offered.

**Known gaps:**
- Only the 12 documented commercial-cloud API hosts are accepted; Mist's federal and private clouds are not.
- The streaming WebSocket API (`wss://api-ws.mist.com`) is not covered.
- Juniper's official MCP server is not mounted; the REST API covers more.
- Icon: the Juniper Mist app icon from the official portal (https://manage.mist.com/images/favicon.svg).
