# BART

Bay Area Rapid Transit: real-time departure estimates, trip planning by departure or arrival time, fares, route and station schedules, station and route information, holidays and special schedules, service advisories, elevator status and the active train count.

**Interface:** hand-written tools over BART's official Legacy API (`https://api.bart.gov/api`, documented at https://api.bart.gov/docs/overview/index.aspx). BART publishes no OpenAPI document and no remote MCP server, so the 18 documented commands of the `stn`, `etd`, `route`, `sched`, `bsa` and `version` endpoints are wrapped directly, requested as JSON with `json=y`. Every tool is read-only, so none needs approval.

**Auth:** API key (registration key). Accept the license and register at https://api.bart.gov/api/register.aspx. The key is sent as the `key` query parameter, which is how the API defines it. BART has no OAuth.

**Icon:** the "ba" badge cropped from the BART logo on the official bart.gov site (`/themes/custom/bart/logo.svg`), with a blue outline so it shows on white; it is not in Simple Icons.

**Known gaps:** BART labels this API "Legacy" and recommends its GTFS and GTFS-Realtime feeds for new work; those are not wrapped. Deprecated commands (`load`, `ver`) are omitted. In-body errors (`root.message.error`) are raised as tool errors. The health check lists stations. Because the key travels in the URL, it appears in request URLs.
