# Mobbin

Search Mobbin's library of real-world mobile and web app screens, flows and design patterns (for example with `search_screens`, which takes a natural-language query and returns matching screens with images and metadata).

**Interface:** Mobbin's official remote MCP server, `https://api.mobbin.com/mcp` (Streamable HTTP; docs: https://docs.mobbin.com/mcp/features). Mobbin has no public REST/OpenAPI or GraphQL API, and the cookie-based community servers are unofficial and not used. Tools are discovered from the server at runtime; the published tool set is read-only, and any non-read-only tool would require approval.

**Auth:** OAuth only. The server publishes protected-resource metadata pointing at Mobbin's Supabase authorization server with dynamic client registration, so Executor discovers everything from the URL (scope `openid`) and the redirect URI is registered automatically. The user signs in with their Mobbin account; the MCP server requires a Pro, Team or Enterprise plan and is rate limited to 60 requests per 60 seconds per user. There is no API key method.

**Known gaps:** The tool count depends on what Mobbin publishes (currently a small, read-only set). The server could not be called without a real account, so only the unauthenticated discovery probe was verified.

Icon: Mobbin's published apple-touch-icon (`https://mobbin.com/mobbin-marketing-pages/images/apple-touch-icon.png`), a 180px PNG of the mark on white.
