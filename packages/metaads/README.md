# Meta Ads

Manage Meta ad accounts across Facebook and Instagram: campaigns, ad sets, ads, creatives, catalogs, pages and performance insights.

**Interface:** Meta's remote MCP server at `https://mcp.facebook.com/ads`, documented by Meta at https://developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-mcp-server/ads-mcp-server-overview (authentication: `.../ads-mcp-server-get-started`). Meta publishes no OpenAPI document for the Marketing API, so the MCP server is the best official source. Tools are discovered from the server at runtime (the tool count is not verified: `tools/list` needs credentials; third-party write-ups say 29). Every tool that is not marked read-only asks for approval.

**Auth:** two methods, both per Meta's get-started page.
- **OAuth (`oauth`):** Meta's authorization server publishes no usable discovery metadata and no dynamic client registration, so you supply your own Meta app. Create one at https://developers.facebook.com/apps, add the use case "Create & manage ads with ads MCP server", and paste the App ID (client ID) and App Secret on the connect page. In the app's Facebook Login for Business settings, add the redirect URI shown on the connect page to the valid OAuth redirect URIs (the local server uses `<its origin>/api/oauth/callback`; hosted Executor shows its own URI on the connect page). Endpoints are declared by hand: `https://www.facebook.com/v26.0/dialog/oauth` and `https://graph.facebook.com/v26.0/oauth/access_token` (client secret in the body, comma-separated scopes). Meta's own docs do not list them.
- **User access token (`token`):** generate one in the Graph API Explorer or your own OAuth flow with the scopes below and paste it. It is sent as a bearer header.

Scopes requested are exactly the ones Meta's get-started page lists: `ads_mcp_management`, `ads_read`, `ads_management`, `catalog_management`, `business_management`, `pages_show_list`, `instagram_basic`. The server's protected-resource metadata also advertises `pages_manage_ads`, which Meta's docs do not list, so it is not requested. The connecting user needs access to the ad accounts in Meta Business Manager.

**Icon:** the Meta company mark (Simple Icons "meta"). Meta Ads has no separate published mark and no official SVG was reachable; this needs explicit acceptance.

**Known gaps:** The Marketing API surface outside what the MCP server exposes is not covered. The OAuth flow was not exercised against Meta (no real accounts are connected).
