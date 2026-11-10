# AbuseIPDB

Check, report and look up abusive IP addresses with AbuseIPDB: single-IP checks (confidence score, country, ISP, Tor flag), per-IP report history, CIDR block checks, the blacklist, single and bulk reporting, and deleting your own reports.

**Interface:** hand-written tools over the documented APIv2 (`https://api.abuseipdb.com/api/v2`, reference at https://docs.abuseipdb.com/). AbuseIPDB publishes no OpenAPI document and no remote MCP server (its official `AbuseIPDB-MCP` is a local stdio server with two read-only tools), so all seven documented endpoints are wrapped directly: `check`, `reports`, `checkBlock`, `blacklist`, `report`, `bulkReport`, `clearAddress`. The mutations (`report`, `bulkReport`, `clearAddress`) require approval.

**Auth:** API key. Create one in your AbuseIPDB account under API at https://www.abuseipdb.com/account/api. It is sent in the `Key` header. AbuseIPDB has no OAuth.

**Icon:** the AbuseIPDB mark from the vendor's own `AbuseIPDB/laravel` repository (`.github/logo.svg`); the mark is not in Simple Icons.

**Known gaps:** the blacklist plaintext mode is not exposed (JSON only). Daily quotas are low on the free plan (blacklist, bulk-report and clear-address: 5 per day), and plan limits apply to `checkBlock` and `blacklist` parameters. The health check runs one `check` of 127.0.0.1, which counts against the check quota. The package id is `abuseipdb`.
