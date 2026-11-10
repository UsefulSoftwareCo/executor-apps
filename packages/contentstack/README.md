# Contentstack

Covers the Contentstack Content Management API for one stack: content types, entries, assets, global fields,
environments, locales, releases, workflows, webhooks, roles, labels, extensions and branches.

**Interface:** OpenAPI. Contentstack's official CMA document, linked from
https://github.com/contentstack/contentstack-openapi and
https://www.contentstack.com/docs/developers/apis/content-management-api:
https://assets.contentstack.io/v3/assets/blt02f7b45378b008ee/blt85399a97399b4ecf/cma-openapi-3.json (195 tools).
The document lists api_key, authtoken and authorization as one combined requirement; `openapi.ts` patches each
operation to need only the stack API key plus a management token.

**Auth:** one method, a management token.
- Stack API key: Settings > Stack > API Credentials in the Contentstack app.
- Management token: Settings > Tokens > Management Tokens > New Token (https://www.contentstack.com/docs/developers/create-tokens/generate-a-management-token). Choose the stack, a branch, and write permission if mutations are needed.
- Region: `na` (default api.contentstack.io), `eu`, `au`, `azure-na`, `azure-eu`, `gcp-na` or `gcp-eu`.

**Known gaps:**
- 26 operations that only accept a user `authtoken` (user session, stack create/update/delete/share/transfer
  ownership/settings, delivery and management token administration, branch create/delete, branch aliases) are
  skipped, because management tokens cannot call them.
- OAuth is not offered. Contentstack OAuth belongs to Marketplace apps, whose authorize and token URLs embed a
  per-app id and a per-account subdomain, which a static declaration cannot express.
- The Content Delivery API, GraphQL Delivery API, Launch, Automate and Personalize APIs are separate surfaces and
  are not included.

## Icon

The Contentstack mark from Simple Icons (CC0), generated with `scripts/icon.ts`.
