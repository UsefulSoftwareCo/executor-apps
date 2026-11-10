# Pinterest

Pins, boards, user accounts, ad accounts and campaigns, catalogs, analytics, audiences and conversion events through the Pinterest REST API v5.

**Interface:** OpenAPI. Pinterest's official description, `https://raw.githubusercontent.com/pinterest/api-description/main/v5/openapi.yaml`, loaded live. Requests go to `https://api.pinterest.com/v5`.

**Auth**

- Access token (`token`): a bearer token. Use a trial/developer token from the app's page at https://developers.pinterest.com/apps/, or an Ads Manager conversion token for the conversion events endpoints.
- OAuth 2.0 (`oauth`): create an app at https://developers.pinterest.com/apps/ and enter its App ID and secret on the connect page. Add the redirect URI shown by Executor to the app's redirect URIs. Token requests use HTTP Basic client auth and scopes are comma separated. Requested scopes cover user accounts (read and write), boards, pins, ads and catalogs.

**Known gaps**

- Under OAuth, operations needing `biz_access:read/write` (about 21), `billing:read/write` (5) or `msot:write` (1) are exposed but will fail with insufficient scope because those scopes are not requested; they work with a token that carries them. These are business-admin and billing scopes, deliberately not requested.
- Pinterest access tokens reportedly last 30 days and refresh tokens 60 days. Apps created before 25 Sep 2025 may need `continuous_refresh=true` on the token request; the framework cannot send it. This is from secondary sources, as the official auth pages were not reachable.
- The spec is loaded from the `main` branch and is not pinned to a commit.

- The spec's `client_credentials` flow (a v3 token endpoint) and HTTP basic scheme are not wired up.
- Pinterest trial access limits which endpoints work until the app is upgraded to standard access.
