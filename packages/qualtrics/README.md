# Qualtrics

Run Qualtrics from an agent: surveys and their definitions (questions, blocks, flow, options), response export, import, create, update and delete, email distributions and reminders, library messages, mailing lists and their contacts, XM Directory contacts, users, groups, divisions and event subscriptions (webhooks).

**Interface:** custom, hand-written tools over the Qualtrics API v3 (`https://<host>.qualtrics.com/API/v3`, docs at https://api.qualtrics.com/). 78 tools. Qualtrics's own OpenAPI documents are not offered as one downloadable file, and the only public document found (APIs.guru, derived from a Microsoft Power Platform connector, not Qualtrics) has 6 operations on a fixed host, so it was not used. An official MCP server is mentioned in Qualtrics documentation, but its URL and authentication are not publicly documented, so it is not used. Reads are queries; every mutation requires approval.

**Auth:** API token only. In Qualtrics open Account Settings > Qualtrics IDs, generate a token under API, and copy your datacenter host (for example `yourorg.co1.qualtrics.com` or `fra1.qualtrics.com`, shown in your browser address bar and on the same page). Enter the host and the token; the app sends the token in the `X-API-TOKEN` header to that `*.qualtrics.com` host only. Qualtrics also supports OAuth 2.0, but its authorization and token endpoints are on each account's own host (`https://<host>/oauth2/auth` and `/oauth2/token`), which an app cannot declare statically, so OAuth is not offered.

**Known gaps:**
- Exported response files are fetched as raw text; compressed (zip) exports cannot be read, so start exports with `compress=false` and a text format.
- Endpoint paths and fields are written from Qualtrics's public API reference and were not exercised against a live account.
- Contact imports (bulk), survey translations, quotas, panel and Stats iQ endpoints, and file uploads are not covered.
- Request bodies for questions, flow and options take JSON objects as documented by Qualtrics.
