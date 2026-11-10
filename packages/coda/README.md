# Coda

Covers the Coda (now Superhuman Docs) API: docs, pages, tables, columns, rows, formulas, controls, folders, permissions, publishing, automations, packs (create, versions, releases, OAuth config, system connections, reviews, permissions, invitations, uploads), go links, workspace members and roles, custom doc domains and analytics.

Interface: OpenAPI, loaded live from the vendor's official document at https://coda.io/apis/v1/openapi.json (server `https://docs.superhuman.com/apis/v1`). The operation list follows that spec, not the rendered docs page.

Auth: API token (bearer). Create one at https://docs.superhuman.com/account under "My account" (the spec's Bearer description points there; coda.io/account redirects to it). Tokens can be restricted to specific docs or tables and to read or write. The spec declares only a bearer scheme and no user-created OAuth apps for the REST API, so there is no OAuth method.

Known gaps: every mutation asks for approval. The vendor spec declares two paths with a literal `${docId}` instead of `{docId}`: `GET` and `POST /docs/${docId}/domains` (`customDocDomains.listCustomDocDomains` and `customDocDomains.addCustomDocDomain`). The importer cannot expose an exclude option, so these two tools are generated but will not work; use `GET /docs/{docId}/domains/{customDocDomain}` and the other custom domain operations instead. That leaves 123 working tools out of 125. Webhook-style triggers and in-doc Brain/AI features are not in the spec.
