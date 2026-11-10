# Fairing

Reads Fairing post-purchase attribution survey data: the questions running on a
shop and the customers' responses (with order, coupon and UTM fields), and pushes
advanced-attribution sources.

**Interface:** two surfaces, chosen by the account's auth method.

- API key accounts get hand-written tools over Fairing's REST API at
  `https://app.fairing.co/api` (docs: https://docs.fairing.co/reference/api).
  Fairing publishes no downloadable OpenAPI document. Tools: `listQuestions`,
  `listResponses` (`starting_after`, `limit` up to 1000, `inserted_at_min`,
  `since`), `createSources` (approval required).
- OAuth accounts get Fairing's official remote MCP server at
  `https://app.fairing.co/mcp`. It is read-only and adds analysis tools
  (per-question response counts, order value and AOV, date-range comparison,
  response summaries; https://docs.fairing.co/docs/mcp.md). Tools are listed live
  from the server once an account is connected.

**Auth:**

- API key: create the Secret Token in Fairing under the shop's integration
  settings (see https://docs.fairing.co) and paste it; it is sent raw in the
  `Authorization` header, with no `Bearer` prefix.
- OAuth: sign in with Fairing when connecting. The MCP server supports dynamic
  client registration with PKCE S256, so nothing needs to be registered first.
  The connection is scoped to one workspace; reconnect to switch workspaces.

## Known gaps

- Fairing's REST OAuth (`responses:read`, `sources:write`) needs a partner
  registration with no self-serve app registration
  (https://docs.fairing.co/reference/connect-with-oauth.md), so it is not used.
  The OAuth method here is for the MCP server only.
- The REST list reference pages are not published, so `listResponses` exposes only
  the parameters named in https://docs.fairing.co/reference/rate-limits.md, and
  `listQuestions` takes none. Response bodies are returned as raw JSON; response
  fields are described at https://docs.fairing.co/reference/the-response-object.md.
- The shared REST rate limit is 100 requests per minute per store.
- `createSources` is partner-only and needs the Advanced Attribution plan. Its
  `channel` must be one of Podcast, YouTube, Instagram, TikTok, Facebook; the
  schema builders have no enum type, so this is stated in the description and
  Fairing rejects other values per item.
- Icon: the Fairing mark from its Shopify App Store listing (1200px PNG); Fairing
  publishes no SVG.
