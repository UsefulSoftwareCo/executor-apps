# Box

Files, folders, collaborations, comments, tasks, metadata, search, shared links, webhooks, users and groups across the Box Platform API.

**Interface:** OpenAPI, from Box's official description, pinned to box/box-openapi commit `5b055e333a802b10b8ca90fcc513643836dd92b4` (https://raw.githubusercontent.com/box/box-openapi/5b055e333a802b10b8ca90fcc513643836dd92b4/openapi.json, server `https://api.box.com/2.0`). At that commit the spec has 297 operations (2 OAuth endpoints removed, 31 skipped); checked 2026-10-12, 264 tools are generated. Box also runs a hosted MCP server at `https://mcp.box.com`; the REST API is used instead because it covers the full Platform API. The `/oauth2/token` and `/oauth2/revoke` endpoints are removed from the tool set so an agent cannot submit client secrets or revoke tokens.

## Auth

- **Developer token** (`token`): create one in the Box Developer Console under your app's Configuration tab. It is valid for one hour, so it suits testing.
- **OAuth 2.0** (`oauth`): create a Custom App with "User Authentication (OAuth 2.0)" in the Developer Console (https://app.box.com/developers/console). Add the Executor redirect URI shown on the connect page to the app's Redirect URIs, then enter the client ID and secret. Executor sends no `scope` parameter: Box grants the scopes enabled on the Custom App's Configuration tab. Enable "Read and write all files and folders stored in Box" (`root_readwrite`) and any other scopes you need before connecting, and re-authorize after changing them.

## Known gaps

- 12 operations are skipped as `multiple_hosts`: 10 upload operations on `upload.box.com` / `{box-upload-server}` (file upload, new versions, chunked upload sessions and parts), `GET /authorize` on `account.box.com`, and `GET /zip_downloads/{id}/content` on `dl.boxcloud.com`. None are on the allowed `api.box.com` origin.
- 19 operations are skipped as `operation_path`: the spec defines them under `#`-suffixed pseudo-paths (for example `#get_shared_link`, `#add_shared_link`, `#refresh`) that are not valid request paths.
- 264 tools are generated (143 mutations, all approval-gated).
- Enterprise-only operations (user provisioning, retention, legal hold) require an app with the matching scopes enabled.
- Client Credentials Grant and JWT server authentication are not offered.
