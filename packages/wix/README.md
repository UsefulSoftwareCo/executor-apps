# Wix

Wix sites and business data (Stores, Bookings, CRM, CMS and the rest of the Wix
REST API), plus Wix documentation search, exposed to agents.

Interface: Wix's official remote MCP server (streamable HTTP),
`https://mcp.wix.com/mcp`, documented at
https://dev.wix.com/docs/sdk/articles/use-the-wix-mcp/about-the-wix-mcp. Wix
publishes no OpenAPI document for its REST API (`https://www.wixapis.com`);
instead the server offers generic tools (`CallWixSiteAPI`, `ExecuteWixAPI`,
`ManageWixSite`, `ListWixSites`, documentation and API-schema search), which
reach every REST method. Listing needs credentials, so no tool count is verified
here.

Auth:

- OAuth (`oauth`): the server publishes OAuth metadata (scope `offline_access`)
  and a dynamic client registration endpoint, so Executor registers its own
  client; no manual OAuth app is needed. The redirect URI is shown on the
  connect page.
- API key (`apiKey`): create an API key at
  https://dev.wix.com/docs/rest/articles/get-started/api-keys and enter it with
  your Wix account ID. The key is sent as the bare `Authorization` header with
  `wix-account-id`, as Wix documents.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: account health only verifies the credentials reach the MCP server.
The icon is the Wix logo from Simple Icons (Wix's mark is its wordmark).
