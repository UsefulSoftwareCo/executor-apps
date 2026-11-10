# Google Contacts

Search, read, create, update and delete Google Contacts, batch create/update/delete, manage contact photos, contact groups and their members, list and search "other contacts" (auto-saved interactions) and copy them into My Contacts, and search or list the Google Workspace directory. 24 tools covering every People API v1 method; 13 mutations require approval.

## Curated tools

The top-level tools are shaped for agents, after [gogcli](https://github.com/openclaw/gogcli)'s typed tool set: `search` across saved contacts, other contacts and the Workspace directory. Reads span every linked account at once unless `account` names one; writes need `account` only when several accounts are linked, and ask for approval. Results name the account they came from by its address, read from OpenID userinfo and cached for a day. Their code is `tools/`, copied from `shared/google-tools` by `node scripts/google-vendor.ts`, which also gives the same tools to the all-in-one `google` package. The generated tools described below are under `api`, each taking an `accountId`.

## Interface

OpenAPI, vendored as `openapi.json`. Google publishes the People API only as a Discovery document, so `discovery-to-openapi.mjs` converts Google's own document (`https://people.googleapis.com/$discovery/rest?version=v1`, revision 20261007) into OpenAPI 3. The conversion is ours, not Google's, and the output is checked in. To refresh, download the document and run `node packages/google-contacts/discovery-to-openapi.mjs <doc> > packages/google-contacts/openapi.json`. Paths use Google's `flatPath` form, so pass the bare id as the path parameter (`peopleId` = `c123456` for `people/c123456`, `contactGroupsId` = `myContacts` for `contactGroups/myContacts`, `otherContactsId` likewise), not the full resource name. Google also runs an official remote MCP server for this API at `https://people.googleapis.com/mcp/v1` (Streamable HTTP, OAuth 2.0). It is a Developer Preview gated by membership in the Google Workspace Developer Preview Program and exposes only three read-only tools (`get_user_profile`, `search_contacts`, `search_directory_people`; scopes `directory.readonly`, `userinfo.profile`, `contacts.readonly`). This package uses the OpenAPI route instead because it covers the full People API (24 tools, including 13 mutations that require approval) and does not depend on preview access.

## Auth

OAuth 2.0 only; Google has no user API keys for private contact data. Create an OAuth client of type "Web application" in Google Cloud Console (APIs & Services > Credentials), enable the People API for the project, and configure the consent screen (add test users while the app is unverified). Add Executor's OAuth redirect URI shown on the connect page to the client's authorized redirect URIs. Scopes: `contacts` (read and write), `contacts.other.readonly`, `directory.readonly`, plus `openid email profile` for the health check; `access_type=offline` and `prompt=consent` ensure a refresh token. These are sensitive scopes, so production use needs Google OAuth verification. Discovery is from `https://accounts.google.com`. Not verified with a real account.

## Known gaps

- Directory tools only return data for Google Workspace accounts.
- Contact photo upload takes base64 bytes in the JSON body; no media upload.
- Service account auth is not offered.
