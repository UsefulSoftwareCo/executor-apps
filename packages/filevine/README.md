# Filevine

Filevine legal case management: projects (cases and matters), contacts, project notes, tasks, deadlines, documents and webhook subscriptions, 22 tools in all.

**Interface:** hand-written tools over the Filevine API v2 gateway (`https://api.filevineapp.com/fv-app/v2`, Canada `https://api.filevineapp.ca`), documented at https://developer.filevine.io/docs/v2-us. The reference is a Stoplight portal that publishes no downloadable OpenAPI document, the only spec copies found are third-party mirrors (not used), and Filevine has no official remote MCP server or GraphQL API. Request bodies for create and update tools are passed through as JSON (`body`), so use the field names from the v2 reference.

**Auth:** one credential set, stored as secrets. Filevine exchanges a personal access token plus API client credentials for a bearer token (about 20 minutes), then requires `x-fv-orgid` and `x-fv-userid` headers. The package does the exchange at `https://identity.filevine.com/connect/token` (Canada `identity.filevine.ca`), calls `GetUserOrgsWithToken` to find the organization and user ids, caches the session, and refreshes it before expiry. Enter:
- `region`: `us` or `ca`.
- `clientId` and `clientSecret`: from Filevine Account Manager > Access Tokens > Client Secret (secrets expire after a year and can only be replaced).
- `personalAccessToken`: created by an Account Admin in Account Manager (Filevine recommends tying it to a service account user).

Identity hosts: `identity.filevine.com` (US) and `identity.filevine.ca` (Canada) were confirmed live through their OpenID discovery documents (`/.well-known/openid-configuration`), whose `token_endpoint` is `/connect/token` and whose `grant_types_supported` includes `personal_access_token`. The `identity.filevine.io` host does not resolve in DNS and is outdated, so this package does not use it. Requested scopes are all listed in the discovery `scopes_supported`; `fv.identity.user.write` was dropped because no tool needs it.

Filevine's API gateway offers no user-created OAuth app, so there is no OAuth method. No redirect URI is needed.

**Icon:** the Filevine mark from filevine.com's own `favicon.svg` (vector, 80x80 viewBox) with its embedded dark-mode CSS removed; it is not in Simple Icons.

**Known gaps:** document upload (multipart) and download streaming are not exposed. Only the first organization of the token is used; accounts that span several organizations need one account per organization token. The `GetUserOrgsWithToken` response is read in both PascalCase and camelCase because tenants differ. Real credentials were not used, so request shapes beyond paths are unverified against a live tenant.
