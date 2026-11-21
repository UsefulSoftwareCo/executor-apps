# Mobbin

Search Mobbin's library of real-world mobile and web app screens, flows and design patterns, and save references to collections. Bundles Mobbin's [agent skills](https://github.com/mobbin/skills).

**Interface:** Mobbin's official remote MCP server, `https://api.mobbin.com/mcp` (Streamable HTTP; docs: https://docs.mobbin.com/mcp/features). Mobbin has no public REST/OpenAPI or GraphQL API, and the cookie-based community servers are unofficial and not used. Tools are discovered from the server at runtime; write tools require approval.

**Auth:** OAuth only. The server publishes protected-resource metadata pointing at Mobbin's Supabase authorization server with dynamic client registration, so Executor discovers everything from the URL (scope `openid`) and the redirect URI is registered automatically. The user signs in with their Mobbin account; the MCP server requires a Pro, Team or Enterprise plan and is rate limited to 60 requests per 60 seconds per user. There is no API key method.

**Known gaps:** Mobbin's interactive gallery (MCP Apps UI) is not rendered through Executor.

Icon: Mobbin's published apple-touch-icon (`https://mobbin.com/mobbin-marketing-pages/images/apple-touch-icon.png`), a 180px PNG of the mark on white.
