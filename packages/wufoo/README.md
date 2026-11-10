# Wufoo

Wufoo (SurveyMonkey) online form builder: forms and their fields, entries (list, count, filter, sort, submit), comments, reports and widgets, sub-users, and form webhooks.

**Interface:** custom, hand-written tools over the Wufoo REST API v3 (`https://<subdomain>.wufoo.com/api/v3`, docs at https://wufoo.github.io/docs/). Wufoo publishes no OpenAPI document, GraphQL API or MCP server, so the 17 documented endpoints are declared by hand. Reads are queries; every mutation (submit entry, add or delete webhook) requires approval. Entries are filtered with `filters` such as `"Field1 Contains Smith"` and submitted as an object of field IDs to values.

**Auth:** API key only. In Wufoo open Form Manager > More > API Information and copy the API key. Enter the account subdomain (the `acme` in `acme.wufoo.com`) and the key; the app sends it as basic auth (`<key>:footastic`, the password is ignored) to that host only. Wufoo has no user-created OAuth apps; its login endpoint is for approved partners.

**Icon:** the mark from Wufoo's own `safari-pinned-tab.svg` on wufoo.com (Simple Icons has no Wufoo entry).

**Known gaps:**
- The partner-only `login` endpoint is not exposed.
- Form creation and editing are not part of the Wufoo API.
- File upload fields cannot be submitted (the API takes form-encoded values only).
- Daily request quotas depend on the Wufoo plan (HTTP 421 when exceeded).
