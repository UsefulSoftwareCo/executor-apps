# Pipedrive

Deals, persons, organizations, leads, activities, pipelines, stages, products, notes, files, webhooks and the rest of the Pipedrive CRM REST API (210 tools, 97 of them mutations that require approval).

**Interface:** OpenAPI. Pipedrive's official v1 description, `https://developers.pipedrive.com/docs/api/v1/openapi.yaml`, loaded live. Requests go to `https://api.pipedrive.com/v1`.

**Auth**

- Personal API token (`secrets`): in Pipedrive, open your avatar, Personal preferences, API tab. Sent as the `x-api-token` header.
- OAuth 2.0 (`oauth2`): create an app in the Pipedrive Developer Hub (developers.pipedrive.com, "Create an app", private or public) and enter its client ID and secret on the connect page. Set the app's callback URL to the redirect URI Executor shows. Scopes are chosen on the app in the Developer Hub, not requested at sign-in. Token requests use HTTP Basic client authentication. Pipedrive's docs name a per-company `api_domain` returned with the token (for example `https://{COMPANYDOMAIN}.pipedrive.com`) and show OAuth calls only against that host; they never say `api.pipedrive.com` accepts OAuth bearer tokens. Executor's framework cannot route per account here: `allowedOrigin` is one static origin, the compiled tools are shared across accounts, and `oauth2` has no way to keep extra token-response fields such as `api_domain`. This package therefore sends OAuth requests to `api.pipedrive.com`, which is UNVERIFIED against a real OAuth app (one third-party guide uses it with a bearer token). If it fails for your company, use the personal API token method, which is documented against `api.pipedrive.com`. The health check also runs against `api.pipedrive.com`.
- OAuth details not verifiable without a live authorize request: `scopes: []` is expected to leave out the `scope` parameter (Pipedrive's authorize endpoint takes only `client_id`, `redirect_uri` and `state`; scopes live on the Developer Hub app), and Executor may add PKCE `code_challenge` parameters. Pipedrive's docs do not mention PKCE and authenticate the token request by client secret over Basic auth, so extra parameters are expected to be ignored.
- `hosts` lists only `api.pipedrive.com`, like the github and linear packages: it covers where the app's `secrets` token is sent. The OAuth client secret goes to `oauth.pipedrive.com` in the host-run exchange.

**Known gaps**

- v2 endpoints (`https://developers.pipedrive.com/docs/api/v2/openapi.yaml`, a separate document under `/api/v2`) are not included; v1 covers more operations.
- Three operations are skipped: `oauth.authorize` (`GET /oauth/authorize`, `multiple_hosts`: it lives on oauth.pipedrive.com) and `oauth.getTokens` / `oauth.refreshTokens` (`POST /oauth/token`, `/oauth/token/`, `auth_method`: they require the spec's `basic_authentication` scheme, which is not declared). Executor performs those exchanges itself.

Icon: Pipedrive's logo mark SVG from the header of https://www.pipedrive.com/en (Simple Icons has no Pipedrive entry).
