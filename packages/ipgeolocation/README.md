# IPGeolocation.io

IP intelligence from IPGeolocation.io: IP geolocation (single and bulk), security and threat signals, ASN details, abuse contacts, timezone lookup and conversion, astronomy (including time series), and User-Agent parsing. 13 tools.

**Interface:** OpenAPI. The vendor publishes seven official per-API specs in <https://github.com/IPGeolocation/openapi> (the repo's root file is a Postman collection and is not used). Each is mounted under its own key (`location`, `security`, `userAgent`, `asn`, `abuse`, `timezone`, `astronomy`); all use `https://api.ipgeolocation.io`. Bulk and custom User-Agent POSTs only read data and are exposed as queries without approval.

**Auth:** API key (`apiKey` query parameter). Create one in the [IPGeolocation dashboard](https://app.ipgeolocation.io/). The vendor has no OAuth. Health check calls the timezone endpoint for `UTC`.

**Gaps:** the official IPGeolocation MCP server (`ipgeolocation-io-mcp` on npm, MIT, 17 tools) is not used: it is local stdio only with no remote URL, so it cannot be mounted as a remote MCP provider. Its `lookup_currency` and `lookup_company` tools have no dedicated endpoint in the seven OpenAPI specs; they wrap slices of the IP lookup response, so currency data is available through the location tools' `fields`/`include` options where the plan allows, and company details are not exposed separately. Account usage/credit endpoints are not in the published specs. Some fields (e.g. security, ASN) require a paid plan.

**Spec pinning:** spec URLs track the `main` branch of IPGeolocation/openapi, not a tag or commit, so an upstream change can alter the tool set. The repo script `scripts/check.sh` reports only the location spec's 2 tools (`options` compiles one spec); all seven specs compile to 13 tools.
