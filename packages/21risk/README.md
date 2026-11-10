# 21RISK

Sites, boards, audits, actions and insurance data in 21RISK, plus search over 21RISK's own documentation.

**Interface:** 21RISK's official remote MCP server, `https://21risk.com/api/mcp` (docs: https://21risk.com/docs/mcp-server). It is the only publicly documented 21RISK interface. The REST API at `api.21risk.com` is shown on https://21risk.com/tools/rest-api with a single endpoint and is issued through sales, and the OData v5 API that other catalogs wrap has no public documentation, so neither is used. Tools are discovered from the server at runtime; non-read-only tools require approval.

**Auth:** OAuth only. The server publishes protected-resource metadata and supports dynamic client registration, so Executor discovers everything from the URL and requests the `agent` scope. At the consent screen the user picks which organizations to share and a Read-only or Full access level per organization; Full access is required for create/update tools. Authorizations can be revoked in 21RISK under Settings > Profile > Authorized Applications. The redirect URI is registered automatically through dynamic client registration. There is no API key method for the MCP server; the vendor's separate REST API uses keys issued through sales.

**Known gaps:** No tool list is published, so the count depends on the connected account. Uploading local files needs Full access and a client that can run local commands, which Executor cannot. The OData and REST APIs are not exposed.

Icon: 21RISK's published mark (`https://21risk.com/safari-pinned-tab.svg`).
