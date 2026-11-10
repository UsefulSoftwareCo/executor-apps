# HubSpot

CRM objects (contacts, companies, deals, tickets, leads, products, line items, quotes, invoices, orders, custom objects and the activity types), associations, properties, pipelines, schemas, lists, imports and exports, owners, marketing (emails, forms, campaigns, events, transactional email), CMS (pages, blog posts, HubDB, redirects, files), conversations, automation (workflows, sequences), communication preferences, files, settings and account info.

## Interface

OpenAPI. HubSpot publishes one official OpenAPI document per API in its public spec collection, https://github.com/HubSpot/HubSpot-public-api-spec-collection (`PublicApiSpecs/...`). This package mounts 86 of those documents, pinned to a commit of the spec collection (so tool names do not shift on upstream merges; bump the SHA in `openapi.ts` to update, and regenerate `empty-security.json` with `scripts/empty-security.ts`) (latest stable version of each, mostly v3 and v4) as separate routers, one per API, all against `https://api.hubapi.com`. About 900 tools in total.

## Auth

- **Private app token** (`token`): in HubSpot, Settings, Integrations, Private Apps, create an app, choose its scopes, and copy the access token. Sent as a bearer token.
- **OAuth** (`oauth`): create a public app in a HubSpot developer account (developers.hubspot.com), copy its client ID and secret, and add the redirect URI shown on the Executor connect page under the app's Auth settings. HubSpot's authorize and token endpoints are not discoverable, so they are declared directly. Only the `oauth` scope is required; the CRM, content, marketing and other scopes are requested as optional scopes (`optional_scope`), and HubSpot drops those the chosen account cannot use. HubSpot rejects the install if a scope in the request is not configured as Optional in the public app's Auth settings, so add every scope in `optionalScopes` in `index.ts` as an Optional scope (keep only `oauth` as Required). A private app token is the simpler path.

## Known gaps

- Endpoints that accept only the developer API key (`hapikey`, used for app-management endpoints such as webhook subscriptions, app timeline templates, custom workflow actions and calling-extension settings) are left out; the webhooks API is not included.
- A few operations are skipped for missing schema components (HubDB, marketing events).
- Several documents overlap (the generic `objects`, `customObjects`, `appointments` and the specific object APIs), so a few operations appear more than once.
- Binary file upload and some multipart operations depend on what the generic OpenAPI runtime supports.

The CRM object documents (contacts, companies, deals, tickets and 28 more) mark every operation `security: []`, although each needs the token. `empty-security.json` lists those 318 operations and `openapi.ts` adds the bearer requirement back to them, so the account's token is sent.
