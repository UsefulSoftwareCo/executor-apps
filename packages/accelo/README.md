# Accelo

Accelo professional services automation: companies, contacts and affiliations, addresses, activities and time, issues (tickets), jobs (projects), milestones, tasks, prospects, requests, contracts, quotes, invoices, payments, expenses, timers, staff, assets, tags, holidays, profile and extension fields, and webhook subscriptions.

## Interface

Hand-written tools (137) over the Accelo REST API v0 at `https://<deployment>.api.accelo.com/api/v0`, documented at https://api.accelo.com/docs/ (source: https://github.com/Accelo/docs). Accelo publishes no OpenAPI document and no official remote MCP server, so each operation is declared from the reference. Lists take `_page`, `_limit`, `_fields`, `_filters` and `_search`; writes take `body` with the documented fields, sent form-encoded as Accelo's samples do. Every write requires approval.

## Auth

- **Service application** (client credentials). In Accelo open Configuration > API, register a Service application, and copy its client id and client secret. Connect with the deployment name (the `<deployment>` of `<deployment>.accelo.com`), the client id and the client secret. The app requests a token with scope `write(all)` each time it starts working; Accelo's token calls do not count against the rate limit.

OAuth 2.0 authorization-code (Web and Installed applications) is not offered. Accelo's authorize and token URLs are per deployment (`<deployment>.api.accelo.com/oauth2/v0/...`) and Executor declares OAuth URLs as static strings, so a single connect page cannot serve every deployment. The service application acts with the permissions Accelo grants it, not those of a person.

## Known gaps

- Invoices, payments, milestones and contracts are read-only: Accelo's API documents no create, update or delete for them.
- Checklists, progressions, collections, resources (attachments), purchases, ledgers, signoffs, skills, segmentations and object budgets are not included, nor are profile or extension value writes.
- Accelo rate-limits to 5000 requests per hour per deployment.
- The icon is the Accelo mark cropped from the logo SVG on accelo.com; the site now also shows an "Acello" favicon.
