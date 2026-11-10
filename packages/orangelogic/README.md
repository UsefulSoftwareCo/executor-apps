# Orange Logic

OrangeDAM (formerly Cortex) digital asset management: search assets (Search API v4 with AI search), read and edit metadata through the DataTable API, public embed/download and presigned links, Share links, upload from URL, batch edit and upsert, proxy regeneration, reports and webhook subscriptions (20 tools).

**Interface:** hand-written tools over the vendor's documented REST API (https://developer.orangelogic.com/reference/about). Orange Logic publishes a small OpenAPI fragment per page of its docs but no single public document, and each customer has its own host, so the tools call the documented `/webapi/...` and `/API/...` endpoints directly. Orange Logic also runs a per-tenant MCP server at `https://<environment>.orangelogic.com/mcp` (OAuth, search only); it is not mounted because its URL and OAuth metadata are per tenant.

**Auth:**
- OAuth 2.0 client credentials: in OrangeDAM go to Administration > Contacts > Accounts, open the account (usually an OAuth Client Application Account), click OAuth 2.0 Client Credentials and copy the Client ID and secret. An administrator must allow bearer authentication on the account. Enter the host, Client ID and secret; Executor exchanges them at `/webapi/security/clientcredentialsauthentication/authenticate_46H_v1` for a short-lived token. Tokens are tied to the requesting IP address.
- Non-expiring bearer token: from the Get bearer token API, with the host.

There is no browser OAuth redirect, so no redirect URI is needed.

**Known gaps:** only hosts under `*.orangelogic.com` are supported (custom domains are refused). Multipart file upload, large-asset chunked upload, contact/group management helpers, metadata-specific samples and the Content Browser SDK are not exposed as dedicated tools; contacts and groups are reachable through the generic `datatable.*` tools. DataTable field names carry their operator (see tool descriptions).
