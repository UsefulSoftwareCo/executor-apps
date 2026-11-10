# Google Admin

Administer a Google Workspace domain through the Admin SDK: users (create, update, suspend, aliases, tokens, 2SV, sign-out), groups and members, org units, domains, customers, admin roles and assignments, Chrome OS and mobile devices, calendar resources, custom user schemas, Chrome printers, audit activity reports, usage reports and data transfers. 139 tools (128 Directory, 6 Reports, 5 Data Transfer); every mutation requires approval.

## Interface

OpenAPI, vendored as `directory.json`, `reports.json` and `datatransfer.json`. Google publishes the Admin SDK only as Discovery documents (`https://admin.googleapis.com/$discovery/rest?version=directory_v1`, `reports_v1`, `datatransfer_v1`, revision 20261004), so `discovery-to-openapi.mjs` converts Google's own documents into OpenAPI 3. The conversion is ours, not Google's, and the output is checked in. The checked-in files are the exact output of that script on the live documents (regenerated against revision 20261004). To refresh, download each document and run `node packages/google-admin/discovery-to-openapi.mjs <doc> > packages/google-admin/<name>.json`. The three APIs are mounted as `directory`, `reports` and `datatransfer` in one router. Paths use Google's `flatPath` form, so pass bare ids as path parameters. No official Google remote MCP server for the Admin SDK was found (not conclusively verified).

## Auth

OAuth 2.0 only, and the signing-in user must be a Google Workspace administrator with the matching admin privileges. Create an OAuth client of type "Web application" in Google Cloud Console (APIs & Services > Credentials), enable the Admin SDK API in that project, and configure the consent screen. Add Executor's OAuth redirect URI shown on the connect page to the client's authorized redirect URIs. Scopes are the read/write `admin.directory.*` scopes, `admin.chrome.printers`, `admin.reports.audit.readonly`, `admin.reports.usage.readonly` and `admin.datatransfer`, plus `openid email profile` for the health check; `access_type=offline` and `prompt=consent` ensure a refresh token. These are restricted/sensitive scopes, so production use needs Google OAuth verification (internal-type apps within your own domain skip it). Discovery is from `https://accounts.google.com`. Not verified with a real account.

## Known gaps

- Service account with domain-wide delegation is not offered.
- Only the three Admin SDK APIs above; the Alert Center, Cloud Identity and Licensing APIs are separate Google APIs.
- Calls fail for non-admin accounts and consumer Google accounts.

## Icon

Google's own Google Admin product icon, downloaded from Google's brand-asset host (`https://www.gstatic.com/images/branding/product/2x/admin_2020q4_512dp.png`, 1024px PNG). Simple Icons lacks it, and no official SVG was found.
