# Store Leads

Query the Store Leads database of ecommerce stores: search and retrieve domains (stores), the ecommerce apps they use, app reviews, technologies and themes, and manage domain lists.

Interface: mixed, in one router with two keys.
- `api`: OpenAPI, from Store Leads' official specification at https://storeleads.app/specification/api/swagger.yaml. It documents only four read operations (list/retrieve domains, list/retrieve apps).
- `custom`: 15 hand-written fetch tools for the other REST endpoints documented at https://storeleads.app/api: bulk domain retrieval (up to 100), domain app reviews, app reviews, domains by company/brand, domains by TLD1, historical archive labels and domains (Enterprise), list retrieval, list add-domains / remove-domains / truncate (mutations, always ask for approval), social media account lookup, technology retrieve/search, and theme search.

Official MCP server: https://storeleads.app/mcp (docs: https://storeleads.app/help/features/mcp) was evaluated and not mounted. It is read-only with 11 tools (search/get/bulk domains, company to domain, detect domain, search/get apps, app reviews, search/get technology, domain products). Everything except `detect_domain` and `get_products_for_domain` is covered by the REST tools above, the MCP server cannot modify lists, and its OAuth metadata advertises only `domains.read`. Its two extras are not mounted.

Auth: API key (bearer token). Create one in your Store Leads account (Account page; https://storeleads.app/api). Requires a plan with API access (Pro or above). Store Leads has no user-created OAuth apps for the REST API.

Icon: the official 128px logo from https://storeleads.app/img/logo_128.png (no SVG is published).

Known gaps: the deprecated streaming `domain-export` endpoint is not exposed (use the domain list's `cursor=all` through the `api` tools instead). Domain search and app search only come from the OpenAPI operations. The `technologies` and `themes` tools take their options as a free-form `params` object. Webhooks are not covered. The health check lists one app.
