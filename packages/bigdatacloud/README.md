# BigDataCloud

IP geolocation (with confidence area), reverse geocoding, timezones, country data, ASN and BGP network data, IP hazard and risk reports, Tor exit nodes, phone and email validation, and User-Agent parsing.

**Interface:** hand-written tools over the vendor's REST API at `https://api-bdc.net/data/<endpoint>` (docs: https://www.bigdatacloud.com/docs). BigDataCloud publishes no OpenAPI document and its only MCP server is a local stdio package, so the 26 tools mirror the documented endpoints. All of them are read-only, so none needs approval.

**Auth:** API key. Create one in the BigDataCloud dashboard (https://www.bigdatacloud.com/login, free tier available) and paste it as the API key. It is sent as the `key` query parameter, as the vendor documents. BigDataCloud has no OAuth.

**Gaps:** the GraphQL API (`api-bdc.net/graphql/<package>`) and the keyless client-side endpoints on `api.bigdatacloud.net` are not exposed. Some endpoints (full geolocation, hazard report, network data) depend on the plan attached to the key.
