# Kintone

Kintone (Cybozu) no-code business apps: records and comments, app settings, forms and layouts, views, reports, notifications, access control, process management (statuses), spaces and threads, guest spaces, files, plugins, bulk requests and cursors.

**Interface:** OpenAPI, from Cybozu's own document at https://github.com/kintone/openapi-spec (`openapi.json`, MIT-0, regenerated daily; it replaces the older kintone/rest-api-spec). It compiles to 204 tools (104 mutations, 0 skipped), including the `/k/guest/{guestSpaceId}/...` form of each endpoint. Every mutation requires approval. The document's server is `https://{subdomain}.cybozu.com`; the app overrides it with the account's own host and sends credentials only there. Record field values are dynamic per app, so record bodies are loosely typed.

**Auth:** two methods, each asking for the site host (for example `acme.cybozu.com`; `kintone.com` and `cybozu.cn` hosts also work).
- **API token:** in the app go to App settings > API Token, generate a token and grant the permissions needed (view, add, edit, delete records, app management). Enter the host, the app ID, and the token (the app ID is only used to check the token; tokens are scoped per app). Tokens only work on that app's endpoints; to reach several apps, a comma-separated list of tokens is accepted by Kintone.
- **Login name and password:** needed for endpoints tokens cannot call (listing apps, space and guest administration, app move, plugins, user/organization APIs). Sent as `X-Cybozu-Authorization`. Use a dedicated account.

**Known gaps:**
- OAuth is not offered. Kintone's OAuth client is per-site (`https://<subdomain>.cybozu.com/oauth2/authorization` and `/token`, scopes `k:app_record:read` etc.) and the `apps` framework (0.0.1-beta.83) only accepts static OAuth endpoint URLs.
- Basic authentication (access restriction) and client-certificate secure access gates are not supported.
- File upload/download use the document's declared bodies; large binary transfers are limited by the framework's response bound.
- The Cybozu User API (`/v1/users.json` on the cybozu.com base) is outside the REST document and is not covered.
- The password header is declared through a placeholder binding; the real value is set by the app on each request.
