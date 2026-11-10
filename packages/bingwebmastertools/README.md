# Bing Webmaster Tools

Manage sites verified in Bing Webmaster Tools: list and verify sites, read search traffic, query, page, keyword and crawl statistics, inbound links and index details, submit URLs, content and sitemaps, fetch as Bingbot, and configure blocked URLs, page preview and deep link blocks, country targeting, URL normalization parameters, crawl rate, site moves and site roles.

## Interface

Hand-written tools over the official JSON endpoints of the Bing Webmaster API (`https://ssl.bing.com/webmaster/api.svc/json/<Method>`; 59 tools, one per method of the documented `IWebmasterApi` interface, minus the obsolete deep link methods). Microsoft publishes no OpenAPI document or MCP server. Method names, parameters and verbs come from https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi. Reads are `GET` with query parameters; writes are `POST` with a JSON body. Every write asks for approval.

## Auth

- **API key**: sign in at https://www.bing.com/webmasters, open Settings, then API Access, and generate an API key. Sent to `ssl.bing.com` as the `apikey` query parameter.
- **OAuth 2.0**: in the same API Access page, create an OAuth Client with a name and the Executor redirect URI shown on the connect page, then paste its client ID and client secret. Requests the `webmaster.manage` scope and sends the bearer token to `www.bing.com`. Refresh tokens last until the user revokes access.

## Icon

Microsoft publishes no downloadable Bing SVG (its trademark page offers only usage guidelines), and Simple Icons has no Bing entry. The icon is Bing Webmaster Tools' own 180px app icon, served by the vendor at https://www.bing.com/webmasters/Content/PWA/iOS/logo/bing-logo-180.png.

## Known gaps

- Object parameters (`blockedUrl`, `crawlSettings`, `settings`, `siteMoveSettings`, `siteRoles`, `filterProperties`) are passed through as JSON; their shapes are described in the tool descriptions.
- Dates are sent as ISO 8601 strings in the query string. Microsoft's pages declare these parameters as .NET `DateTime` but show no request sample, so the accepted format is unverified against a live account (WCF query-string conversion normally parses ISO 8601 via `DateTime.Parse`). The API returns WCF-style `/Date(ms)/` values.
- Responses are returned exactly as Microsoft sends them, wrapped in a `{ "d": ... }` envelope; read the payload from `d`.
- OAuth token refresh is unverified against a live account. Microsoft's OAuth page is inconsistent about the refresh endpoint (`/webmasters/oauth/token` in text, `/webmasters/token` in its sample) and lists `grant_type=authorization_code` in the refresh table, which looks like a doc error. The package uses `/webmasters/oauth/token` and the standard `grant_type=refresh_token`.
- The obsolete deep link methods (`GetDeepLink`, `GetDeepLinkAlgoUrls`, `UpdateDeepLink`) are not exposed.
- Not exercised against a live account.
