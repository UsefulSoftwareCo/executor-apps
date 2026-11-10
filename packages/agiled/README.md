# Agiled

Agiled is an all-in-one business management platform. This package covers its public REST API: CRM (contacts, accounts, deals, pipelines, notes, tasks, meetings), projects, tasks and milestones, invoices, estimates, expenses, payments, products, tickets, time logs, employees, forms, documents and files.

## Interface

OpenAPI 3.0, the document the product itself serves at https://app.agiled.app/docs (server `https://my.agiled.app/api/v1/`). 164 tools, 97 of them mutations (all require approval). Two operations whose paths lack a leading slash in the document (`crm/deals/{id}`, `crm/pipeline/{id}`) are skipped by the compiler; their `/crm/...` equivalents are present.

Agiled's newer developer docs (https://docs.agiled.app/docs/developers) describe a `/public/v1` API with `Authorization: Bearer` tokens (Settings > API). Its origin is per workspace (Settings > API > API base URL) and is not discoverable without an account, so it cannot be declared in a static `hosts` list or probed anonymously. The docs say a generated OpenAPI reference exists and that the document is linked from Settings > API; the public docs pages (api, base-urls, changelog) link no downloadable spec file, so none could be compared or used. This package therefore targets the legacy `/api/v1` API at `my.agiled.app`, whose spec the product serves at a public URL and whose host is fixed. The authentication, base-urls and Public API changelog pages (checked 2026-10) do not mention any deprecation of `/api/v1`.
## Auth

API token plus account URL (`secrets`). In Agiled open Settings > API Settings and copy the API token; the account URL (for example `yourcompany.agiled.app`) is sent as the `Brand` header. The token goes to the API as the `api_token` query parameter, as the document specifies. The API limit is 180 requests per hour. OAuth: the vendor's authentication, api-keys-linked, base-urls and changelog developer pages describe only Bearer API keys; the sole OAuth mention is that "OAuth-derived abilities are limited by the connecting user's current permissions", with no app registration, authorize/token endpoints or scopes documented, so no `oauth2` method is declared.

## Icon

Agiled's own wordmark (the logo the product shows at https://app.agiled.app/agiled-logo-color.png), vectorized to SVG because Agiled publishes no SVG logo. The vendor site also serves a 32x32 raster favicon (white "a" on a blue square, https://app.agiled.app/favicon/favicon-32x32.png) and no SVG of it; raster favicons are not used, so the wordmark is traced from the 552x188 PNG (vendor blue, visible on light and dark backgrounds).

## Known gaps

The `api_token` travels as a query parameter (vendor-mandated by the legacy spec), so it appears in request URLs; whether the framework logs or persists full request URLs in telemetry or errors was not verified. The document has no response schemas for many operations and no security scheme, so credentials are injected from the account. File upload endpoints are listed but multipart support depends on the framework.
