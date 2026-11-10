# Domotz

Network monitoring and management with Domotz: collectors (agents), devices, alerts and alert rules, organizations, contacts, custom tags, custom drivers, datapoints and audit logs. This package also covers the catalog target "Domotz MCP"; the official remote MCP server (`https://mcp.domotz.com/mcp`, OAuth only) is not mounted: its tool list was not enumerated, and the Public API's 182 operations are expected to cover it. The Domotz Marketplace API (https://portal.domotz.com/openapi.json) is a separate surface and is not included.

**Interface:** Domotz Public API, built from Domotz's official OpenAPI 3.1 document at https://api-us-east-1-cell-1.domotz.com/public-api/v1/meta/open-api-definition (182 tools, 89 of them mutations that require approval). The document nests its `servers` array one level too deep and has one path with a stray `?)` suffix (getDeviceConfiguration), so the package patches both before compiling.

**Auth:** API key. In the Domotz Portal open Settings, Services, API Keys (https://portal.domotz.com/portal/settings/services?selected_menu=api_keys), choose "Create an API Key" and copy both the key and the endpoint shown with it. Enter the endpoint host (for example `api-eu-west-1-cell-1.domotz.com`) and the key. Every account is served from its own regional cell, and the key is only sent to that host.

**Gaps:** No OAuth (the Public API only accepts API keys).
