# Vimeo

Videos, folders, albums, channels, showcases, live events, comments, text tracks,
analytics and the rest of the Vimeo API: 328 tools, 162 of them mutations (each
needs approval).

## Interface

OpenAPI, from Vimeo's official `vimeo/openapi` repository:
https://raw.githubusercontent.com/vimeo/openapi/master/api.yaml

Vimeo archived that repository in December 2023, and its current spec is only
served to authenticated callers (`GET https://api.vimeo.com/?openapi=1`), so
newer endpoints may be missing. Vimeo also runs a remote MCP server at
https://mcp.vimeo.com/mcp, which was not chosen because the OpenAPI document
exposes far more tools.

## Auth

- **Personal access token**: create an app at https://developer.vimeo.com/apps,
  open its Authentication tab, and generate a token with the scopes you need.
- **OAuth**: use your own Vimeo app's client identifier and secret. Add the
  redirect URI shown on Executor's connect page under the app's callback URLs.
  Scopes requested: public, private, email, create, edit, delete, interact,
  upload, stats, video_files. Credentials go to `api.vimeo.com` only.

## Known gaps

- Spec is from late 2023; newer API features are not generated.
- Scopes `promo_codes`, `purchase` and `purchased` (Vimeo On Demand) are not requested.
