# Knack

Knack is a no-code database and app platform. This package covers two official surfaces, chosen by how the account connects:

- **API key account**: five hand-written record tools (`list`, `get`, `create`, `update`, `delete`) over Knack's documented object-based REST API, `https://api.knack.com/v1/objects/{object_key}/records` (docs: https://docs.knack.com/reference/object-based-requests). Knack publishes no OpenAPI document, so these are written by hand. `list` supports `filters` (Knack filter JSON), sorting, `format` and paging.
- **OAuth account**: Knack's official Builder MCP server, `https://mcp.knack.com/mcp` (docs: https://docs.knack.com/docs/mcp). It exposes 18 tools (applications, data model, records, access control, auth, skills). The records tools `manageKnackRecord` and `queryDatabase` are Early Access only. MCP tools are approval-gated unless read-only.

## Auth

- **App API key** (`apiKey`): needs the Application ID, the app's API key, and one object key (for example `object_1`, used only for the health check), found under Settings > API & Code > API in the Knack Builder (object keys appear in the object's URL and API docs). The key has full access to every record in that app; one account is one app.
- **OAuth** (`oauth`): sign in with your Knack Builder (dashboard.knack.com) credentials. The server supports dynamic client registration and OAuth 2.1 with PKCE, discovered from the MCP URL. The client is created through dynamic client registration.

Credentials go to `api.knack.com` and `mcp.knack.com`.

## Known gaps

- GovCloud and fully private Knack instances use different hosts; this package targets the standard cloud only.
- View-based requests (user tokens), remote logins and file/image uploads are not exposed.
- The API-key health check calls the documented `GET /v1/objects/{objectKey}/records?rows_per_page=1`; it was not exercised against a real account.
- Knack allows 10 requests per second and plan-based daily limits.
