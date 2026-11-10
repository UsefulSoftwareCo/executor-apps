# IPLocate

Look up an IPv4 or IPv6 address with IPLocate: country, city, coordinates, time zone, postal code, currency, ASN, company, hosting provider, privacy flags (VPN, proxy, Tor, relay, abuser) and abuse contact.

**Interface:** hand-written tool over the documented lookup API (`GET https://iplocate.io/api/lookup/<ip>`, docs at https://www.iplocate.io/docs/ip-intelligence-api/). IPLocate publishes no OpenAPI document; its official MCP server (`iplocate/mcp-server-iplocate`) is a local stdio server wrapping the same single endpoint. The `lookup` tool takes an optional `ip` (omit for the caller's address) and optional `include` field list.

**Auth:** API key, created in your IPLocate account dashboard (free accounts get 1,000 requests per day; sign up at https://iplocate.io/signup). Sent in the `X-API-Key` header. IPLocate has no OAuth.

**Icon:** the official IPLocate icon from the vendor's `iplocate/mcp-server-iplocate` repository (`assets/icon.png`, 384px); the mark is not in Simple Icons.

**Known gaps:** historical lookups (`at`, Enterprise only), the single-field path form and the bulk database downloads are not exposed. The health check performs one lookup of 8.8.8.8, which counts against the daily quota.
