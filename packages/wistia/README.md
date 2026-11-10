# Wistia

Media, folders, channels, webinars, captions, speakers, tags, brands, account stats and analytics from Wistia's Data API (193 tools, 101 of them mutations, each requiring approval).

Interface: OpenAPI, the vendor's official "modern" Data API description at https://wistia.github.io/wistia/api/openapi-modern.yaml (advertised from https://api.wistia.com/.well-known/api-catalog), served from `https://api.wistia.com/modern`.

Auth:

- API access token: create one in Wistia under Account Settings > API tab (Account Owner only; other users must ask the Account Owner), choosing the permissions it needs (https://docs.wistia.com/docs/making-api-requests). Sent as a bearer token.
- OAuth2: Wistia publishes RFC 8414 metadata at `https://api.wistia.com`, so the app uses discovery with scope `all:all`. Roughly half of the operations in the spec (about 90 of the 182 that require an API token permission) need the `all:all` permission and no narrower scope (`all:read`, `media:read`, `stats:read`, `media:upload`) covers them, so the app requests it. Client setup, per Wistia's OAuth2 guide (https://docs.wistia.com/docs/authenticating-with-oauth2): OAuth2 is "not yet available for all accounts", so first contact Wistia support (https://wistia.com/support/contact) to have it enabled. Then go to Account > Settings > OAuth Applications > New Application, enter a name, description and the Executor redirect URI shown on the connect page, and select the `all:all` permission. Open the app to copy the client ID and client secret and enter them in Executor's OAuth connect form (Executor owns the OAuth client; the provider has no dynamic-registration option). Only Wistia account Managers and owners can authorize an application. Wistia's token endpoint accepts client_secret_basic and client_secret_post, which discovery picks up.
- Not used: Wistia also supports RFC 7591 dynamic client registration at `https://api.wistia.com/oauth/register` (https://api.wistia.com/auth.md, aimed at agents), but Executor's `oauth2` provider cannot drive it, so the manually created OAuth Application above is the supported route.

Known gaps: the Upload API (`upload.wistia.com`, multipart) is a separate origin and not included. Wistia also has an official remote MCP server (`https://api.wistia.com/mcp/api`, OAuth) that was not mounted because the OpenAPI tools cover the API.
