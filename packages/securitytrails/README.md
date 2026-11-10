# SecurityTrails

Domain, DNS, WHOIS, subdomain, SSL certificate and IP intelligence from SecurityTrails (a Recorded Future company), plus the Attack Surface Intelligence (ASI) v2 API: projects, assets, exposures, tags, static asset rules and Action Center report downloads.

## Interface

Hand-written tools (40 operations) over the REST API at `https://api.securitytrails.com` (v1 and v2). The vendor docs index (https://docs.securitytrails.com/llms.txt) lists no OpenAPI document download and no MCP server, and a search for an official SecurityTrails MCP server or OpenAPI file could not be completed (search budget exhausted), so none is known to exist; hand-written tools are used. Each endpoint was checked against its vendor reference page, listed in that index as `https://docs.securitytrails.com/reference/<slug>.md`:

- v1 domain, history, search, IP, scroll: `get-domain-old-1`, `list-subdomains-old-1`, `list-tags-old-1`, `find-associated-domains-old-1`, `get-whois-old-1`, `whois-history-by-domain-old-1`, `dns-history-by-record-type-old-1`, `get-domain-ssl-data-old-1`, `search-old-1`, `search-domain-dsl-2-1`, `search-count-old-1`, `search-ips-dsl-old-1`, `ip-search-statistics-old-1`, `scroll-old-1`, `explore-ips-old-1`, `get-ip-whois-old-1`, `get-useragents-for-ip-old-1`, `ping-old-1`, `usage-old-1`.
- Action Center: `async-reports`, `check-download-status`.
- ASI projects, assets, tags, exposures, rules: `project-list_projects-1`, `assets-*`, `tagging-*`, `exposures-*`, `rules-*`.
- Company: `get-company-associated-ips`.

Mutations (tagging, static asset rules, starting a report download) require approval.

## Auth

API key only. SecurityTrails offers no OAuth. Create or copy the key in the SecurityTrails account at https://securitytrails.com/app/account/credentials. The key is sent in the `APIKEY` header (https://docs.securitytrails.com/docs/authentication). Health uses `GET /v1/ping`.

## Known gaps

- Data feeds (`/v1/feeds/...`) and the synchronous Action Center report download (`/v2/action_center/reports/...`) return gzipped CSV binaries, which the JSON-only tool runtime cannot return, so they are omitted. Use the asynchronous report download, which returns signed links.
- The SQL API (`/v1/sql/query`) is a separately sold product and is not included.
- ASI and some search endpoints need specific paid plans; other plans receive 401/403 from SecurityTrails.
- `domain.subdomains` takes only the hostname; the vendor page documents no other parameters.
- DSL and bulk endpoints take their request body as a free-form JSON `body` argument; the descriptions list the documented fields.
