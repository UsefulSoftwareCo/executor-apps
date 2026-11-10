# Company URL Finder

Look up a company's website domain from its name, its name from a domain, or its LinkedIn company-page URL from a name or domain (the vendor's CUFinder service). Three tools, all read-only; each record found costs one credit.

**Interface:** hand-written tools over the vendor's REST API (`https://api.companyurlfinder.com/v2/services/...`, docs at https://apidocs.companyurlfinder.com/). The vendor publishes no OpenAPI document or MCP server.

**Auth:** API key only, sent as the `x-api-key` header. Log in at https://companyurlfinder.com/login and open API key management to generate one. The vendor has no OAuth.

**Health check:** the API has no account or balance endpoint and every found record spends a credit, so health posts a lookup with an empty domain: a wrong key returns 401, a valid key returns 422 for the invalid data without spending a credit. This behaviour is inferred from the documented status codes and was not verified against a live key.

**Gaps:** the vendor's other CUFinder APIs (employees finder, LinkedIn-to-domain, person profile enrichment) are documented on a separate site and not exposed.
