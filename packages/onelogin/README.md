# OneLogin

Covers the OneLogin API for an account: users, roles, groups, apps and app rules, MFA, privileges, events, invite links, SAML assertions, branding, smart hooks, API authorization servers (scopes, claims, client apps) and more, 159 tools in all (89 mutations, each requiring approval).

Interface: OpenAPI 3.0, OneLogin's official document published in the `v3` branch of its Java SDK repository, https://raw.githubusercontent.com/onelogin/onelogin-java-sdk/v3/api/openapi.yaml (OneLogin's developer docs say its OpenAPI documents are used to generate its SDKs). OneLogin publishes no stable standalone spec URL, so this is the repository file. The document's server is `https://your-api-subdomain.onelogin.com`, so each account's own subdomain is used as the base URL and credentials are only ever sent to that origin.

Auth: API credentials (OAuth 2.0 client credentials). In OneLogin open Administration > Developers > API Credentials, create a credential pair with the scope the tools need (Read Users, Manage Users, Read All or Manage All), and copy the Client ID and Client Secret. Enter them with your subdomain (`acme` for `acme.onelogin.com`). Executor exchanges them at `https://<subdomain>.onelogin.com/auth/oauth2/v2/token` (HTTP Basic, `grant_type=client_credentials`) for a 10 hour token and renews it. This is done in code rather than with the framework's `oauth2` method because the token endpoint is on the customer's own subdomain. OneLogin has no user-level OAuth app flow for its management API, so no authorization-code method is offered.

The account check mints a token and calls `GET /auth/rate_limit`; a 403 is treated as valid credentials whose scope does not cover it.

Known gaps: two operations (the token endpoints) are skipped because they take no bearer token; token generation is handled automatically. Which operations succeed depends on the credential scope. Some older v1 endpoints in the document are included alongside their v2 successors. Vendor icon: the OneLogin wordmark (OneLogin has no separate symbol), cropped from https://www.onelogin.com/maintenance/onelogin-logo.svg to drop the "by One Identity" line.
