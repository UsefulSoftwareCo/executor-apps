# Ipdata.co

Look up IP addresses with ipdata: geolocation, ASN, owning company, mobile carrier, time zone, currency and threat/VPN/Tor data, one at a time or in bulk (up to 100 per request).

**Interface:** hand-written tools over the documented REST API (`https://api.ipdata.co`, docs at https://docs.ipdata.co/). ipdata publishes no OpenAPI document (its docs `llms.txt` links none) and no remote MCP server, so the nine read tools are wrapped directly: `lookup`, `bulk`, `asn`, `company`, `carrier`, `timeZone`, `currency`, `threat` and `field`. The API has no write operations; `bulk` is a POST that only reads, so it needs no approval.

**Auth:** API key. Create one in your dashboard at https://dashboard.ipdata.co/ . It is sent in the `api-key` query parameter, as the vendor documents. ipdata has no OAuth.

**Icon:** the ipdata pin mark, cropped from the vendor's own logo SVG at https://ipdata.co/assets/img/ipdata-logo-dark.svg.

**Known gaps:** only the global endpoint `api.ipdata.co` is used; the EU endpoint (`eu-api.ipdata.co`) is not offered. Company, carrier, time zone, currency, threat and bulk data may depend on the plan (unverified; the vendor docs do not state plan gates). The health check does one `lookup` of 8.8.8.8, which counts against the request quota. The documented API is these few endpoints with a `fields` filter.
