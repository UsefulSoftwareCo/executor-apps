# SimpleKPI

KPIs, KPI entries (the data points), categories, units, frequencies, icons, users, group items and the all-data-entries report for a SimpleKPI account.

Interface: custom hand-written tools over SimpleKPI's REST API, `https://<subdomain>.simplekpi.com/api/`, documented at https://support.simplekpi.com/Developers. SimpleKPI publishes no OpenAPI document, so each documented endpoint is a tool (55). Every mutation asks for approval.

Auth: API token only (SimpleKPI has no OAuth). Enable API access and copy the token in SimpleKPI under Settings | Developer API (not available on the Individual plan). Enter the account subdomain (the `<subdomain>` of `<subdomain>.simplekpi.com`), the email of the user the token belongs to, and the token; requests use HTTP basic auth with `email:token`.

Health check: the connection test reads `/api/kpifrequencies`, a lookup list. SimpleKPI does not document per-role endpoint access, so this was chosen over `/api/users` (which a non-admin token might be refused); it is unverified against a live non-admin token. Other tools may still be refused for roles without permission.

Known gaps: calculated KPIs cannot be changed through the API, user passwords cannot be changed through the API, and the API has a rate limit of at least 200 requests per minute (HTTP 403 with `Retry-After` when exceeded). XML is not used.
