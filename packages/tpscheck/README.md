# TPSCheck

Check UK phone numbers against the Telephone Preference Service (TPS) and Corporate TPS (CTPS) registers with TPSCheck.uk. Each check returns the E.164 number, validity, line type, carrier, location, reachability and the `tps`/`ctps` flags.

**Interface:** hand-written tools over the documented API (`https://api.tpscheck.uk`, docs at https://tpscheck.uk/documentation/). TPSCheck publishes no OpenAPI document and no MCP server, so the four documented endpoints are wrapped directly: `check`, `batch`, `credits`, `status`. Check and batch request `?version=2` (the enriched format; the default is the legacy v1 shape). `check` and `batch` are declared as mutations and require approval because each call spends billable credits; `credits` and `status` are read-only queries.

**Auth:** API key. Create a free account at https://tpscheck.uk/signup/ (the signup page advertises 50 free checks per month with no card, while the documentation's rate-limit table lists the Free plan at 200 requests per month and 5 requests per minute; confirm with the vendor) and copy the key from your profile page. It is sent as `Authorization: Token <key>`. TPSCheck has no OAuth.

**Icon:** the mark from the vendor's own logo SVG (https://tpscheck.uk/static/images/logo-tpscheck.svg), with the wordmark text removed. Not in Simple Icons.

**Known gaps:** the vendor docs conflict on batch eligibility: section 6 (the endpoint reference) says Pro and above, section 14 (Bulk Checking) says Starter, Pro, Business and Enterprise. The tool description follows section 6; ask support@tpscheck.uk to resolve it. The 5/min Free-plan rate limit (10/sec Starter) returns 429 and mostly affects repeated `check` calls, so prefer `batch` on plans that have it. Also, the documented 1,000-number CSV bulk upload, 28-day automation, audit logs and webhooks are dashboard features without documented API endpoints, so they are not exposed. The `risk` object is returned only on Business and Enterprise plans. The health check calls `/credits`, which needs a valid key but spends no credit.
