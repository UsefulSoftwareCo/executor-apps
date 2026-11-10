# Formsite

Formsite online forms and surveys: list forms, read a form's items, query results (paging, date/id ranges, Results Views, searches) and manage result-completed webhooks. 7 tools.

**Interface:** hand-written tools over the official Formsite API v2 (`https://{server}.formsite.com/api/v2/{user_dir}`), documented at https://support.formsite.com/hc/en-us/articles/360000288594-Formsite-API. Formsite publishes no OpenAPI document and has no official MCP server. Mutations (create and delete webhook) require approval.

**Auth:** API access token. The API needs a Professional-level Formsite plan. Open a form, Settings, Integrations, Formsite API: the page shows the token, the server (for example `fs1`) and the user directory used in the API URL. Enter all three when connecting. The token is sent as `Authorization: bearer <token>` to `*.formsite.com` and grants access to all of the account's forms. Formsite offers no OAuth.

**Known gaps:** the API is read-mostly; it cannot create or edit forms or submit results. Rate limits are 50 calls per minute and 10,000 per day.
