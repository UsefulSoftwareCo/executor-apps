# Hookdeck

Covers the Hookdeck Event Gateway Admin REST API: connections, sources, destinations, events, requests, attempts, issues, transformations, bookmarks, integrations and teams. 135 tools, 74 of them mutations (all require approval).

Interface: OpenAPI, from Hookdeck's official document at https://api.hookdeck.com/2025-07-01/openapi (API base `https://api.hookdeck.com/2025-07-01`).

## Auth

API key (bearer token). Create it in the Hookdeck dashboard under Project Settings > Secrets > API Keys. Hookdeck does not offer user-created OAuth apps for the Admin API, so there is no OAuth method. The spec also lists HTTP basic auth, which is not exposed.

## Known gaps

- Hookdeck's document names two component schemas with a slash (`SourceConfigWebhookAuthGooglePub/Sub`, `SourceConfigGooglePub/SubAuth`). The compiler rejects such references, which skipped every source and connection operation. `openapi.ts` applies documented `patches` that rename them to slash-free names, so all 135 operations compile. The patch replaces the whole `SourceConfigWebhookAuth.oneOf` array (patches cannot index arrays) and must be revisited if Hookdeck changes that schema or issues a new API version.
- The separate Outpost API (outbound webhooks, `api.outpost.hookdeck.com`) is not included: Outpost is an Apache-2.0, self-hostable product with its own docs, deployment and auth, and lists the Event Gateway only as one destination type.
- Icon is Hookdeck's official `favicon.svg` from hookdeck.com (the product mark on its blue tile).
