# Metabase

Cards (questions), dashboards, collections, databases, tables, datasets, users, groups, permissions, alerts and more on your own Metabase instance (self-hosted or Metabase Cloud).

## Interface

OpenAPI. Metabase publishes its API as an OpenAPI 3.1 document from every instance at `<your-metabase-url>/api/docs/openapi.json` (Metabase 0.55 or newer; see https://www.metabase.com/docs/latest/api). The package loads the document live from the connected instance, so the tools match that instance's version. 728 tools are generated from the current document (376 mutations, which always ask for approval) with none skipped. Compile checks use Metabase's public `https://stats.metabase.com` document.

## Auth

API key only. Create one in Metabase under Admin > Settings > Authentication > API keys (https://www.metabase.com/docs/latest/people-and-groups/api-keys); the key's permissions are those of the group you assign it to. Connect with the instance URL (for example `https://acme.metabaseapp.com`) and the key, sent as the `X-API-Key` header. Metabase has no user-created OAuth apps for its API.

## Known gaps

- Requires Metabase 0.55+ for the OpenAPI document. The document is fetched without credentials (it loads unauthenticated from stats.metabase.com); an instance that requires auth for `/api/docs/openapi.json` would fail to load.
- The instance URL must use https; http URLs are rejected so the key is never sent in plaintext.
- Instances live on arbitrary domains, so the provider declares no `hosts` allow-list; the key goes to the URL you enter.
- The session-token flow (`X-Metabase-Session`) is not offered.
