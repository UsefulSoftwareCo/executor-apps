# Coresignal

Search and collect B2B data from Coresignal's multi-source Company, Employee and Jobs APIs: Elasticsearch DSL search (and semantic search), search preview, collect by ID or profile shorthand name, company enrich by website, historical headcount, asynchronous bulk collect with result file retrieval, and the Real-time Employee API for live profile scraping.

**Interface:** custom (hand-written `fetch` tools). Coresignal publishes no official OpenAPI document, only docs with cURL examples, and no official MCP server, so the endpoints were written from https://docs.coresignal.com (base `https://api.coresignal.com/cdapi/v2`, real-time API at `/rtapi/v2/employee/scrape`).

**Auth:** API key. Create it on the Coresignal self-service dashboard (https://dashboard.coresignal.com, "API Keys"); it is sent in the `apikey` header. Coresignal has no OAuth.

**Notes and gaps**
- Collect, enrich, bulk collect and real-time scraping spend credits; search returns IDs and previews have their own credit cost. Bulk requests and the real-time scrape require approval.
- Bodies for search take the Elasticsearch DSL `query` object; field names are in each dataset's data dictionary.
- Not covered: Search Filters endpoints, webhook subscriptions, Company/Employee Posts APIs, Clean Company data and the additional-source datasets (Docker Hub, Chrome Store, etc.).
- The key health check runs a minimal company search because there is no free account endpoint.
