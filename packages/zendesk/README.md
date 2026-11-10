# Zendesk

Zendesk Support (tickets, users, organizations, groups, views, macros, triggers, automations, custom fields, incremental exports and the rest of the Support API) plus the Help Center API (articles, sections, categories, translations, posts, votes).

**Interface:** OpenAPI, from Zendesk's own documents: Support at https://developer.zendesk.com/zendesk/oas.yaml (662 tools) and Help Center at https://developer.zendesk.com/help_center/oas.yaml (182 tools). They are exposed as the `support` and `helpCenter` routers. Every mutation requires approval. Both documents use a `{subdomain}` server, so the app overrides the base URL with the account's own host and only sends credentials there.

**Auth:** API token only, and Zendesk is retiring it. Per Zendesk's [OAuth migration guide](https://developer.zendesk.com/documentation/authentication/oauth-migration/) (Ticketing, Help Center and Voice APIs are in scope): from 2026-10-27 existing accounts can no longer create new API tokens, and on 2027-04-30 all remaining tokens are permanently deactivated (accounts created from 2026-07-28 cannot use tokens at all; tokens unused for 30 days are deactivated). Until then: in Admin Center go to Apps and integrations > APIs > Zendesk API, enable token access and add an API token. Enter the subdomain (the `acme` in `acme.zendesk.com`; 3-63 letters, digits and hyphens, no underscores), the email of the agent that owns the token, and the token. The app sends it as basic auth with the username `<email>/token`. Input that is not a plain subdomain (for example `acme.zendesk.com.evil.com`) is rejected.

**Status: blocked on OAuth.** Zendesk's replacement is OAuth, created by an admin in Admin Center (Apps and integrations > APIs > OAuth clients; token endpoint accepts `client_id`/`client_secret` in the body). Its endpoints are per-account (`https://<subdomain>.zendesk.com/oauth/authorizations/new` and `/oauth/tokens`), but the `apps` framework (0.0.1-beta.83, `contracts/host.d.ts`) only accepts static `authorizationUrl`, `tokenUrl` and `discover` strings, so `oauth2` cannot be declared yet. Once the framework supports account-templated OAuth endpoints, add `oauth2` with `tokenEndpointAuthMethod: "client_secret_post"`; the tools need no change.

**Notes:**
- One Help Center operation, `ListFeaturedArticles`, has the path `/hc/api/v2/articles/featured` in Zendesk's own document rather than `/api/v2/help_center/...`. It is in the official spec (Help Center search settings); it resolves to `https://<subdomain>.zendesk.com/hc/api/v2/articles/featured`. Zendesk's prose docs do not mention it, so it is unverified beyond the spec.
- The Help Center document compiles to 182 tools with 0 skipped, checked manually because `scripts/check.sh` only compiles the exported `options` (Support, 662 tools).

**Known gaps:**
- Zendesk Sell (`api.getbase.com`, its own API with OAuth and a GraphQL endpoint) is a separate product and has no package in this batch; it should be its own target.
- Zendesk Chat (`/api/v2/chat`, needs an OAuth token) publishes no OpenAPI document, so it is not covered. Talk/Sunshine Conversations are also separate APIs.
