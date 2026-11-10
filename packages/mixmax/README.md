# Mixmax

Mixmax sales engagement for Gmail: sequences and their recipients, contacts and contact groups, messages, templates (snippets), tasks, meetings and transcripts, teams, unsubscribes, insights reports, the reports data table, and Salesforce sync. 101 tools, 45 of them mutations (each asks for approval).

## Interface

The Mixmax REST API at `https://api.mixmax.com/v1`. Mixmax publishes no standalone OpenAPI document (the `/openapi.json` and `/swagger.json` paths do not exist, and ReadMe marks the download admin-only). `openapi.json` here is assembled from the "OpenAPI definition" block embedded in each reference page, fetched as Markdown from `https://developer.mixmax.com/reference/<slug>.md` (for example `.../reference/contacts.md`). `https://developer.mixmax.com/llms.txt` indexes only some of those pages (19 at the time of writing), so it is not the page list. Each operation's `operationId` in `openapi.json` is the `<slug>` of the page it came from, which gives the full list of 101 pages. To refresh, re-fetch `reference/<operationId>.md` for each, extract the spec block, and merge the paths and components unchanged into one document. Mixmax's own definitions are used unmodified. Pages without such a block (older legacy-format pages such as polls, Q&A, reminders and rule actions) are not covered.

There is also an OAuth-protected remote MCP server at `https://mcp.mixmax.com/mcp`. It is a Labs beta that must be enabled per workspace, and it advertises only the `meetings:read` scope, so it is not mounted here.

## Auth

API token (`X-API-Token` header). Create it from your Mixmax account settings (the developer settings are at app.mixmax.com/dashboard/settings/developer); Mixmax's public docs do not name the exact token-creation menu path. The token acts as the user who created it. Mixmax's REST API has no OAuth for third-party apps, so there is no OAuth method.

## Known gaps

- Calls endpoints are in limited beta and return 404 unless Mixmax has enabled them for the account.
- Some endpoints need the `mixmaxApi` feature or an admin plan.
- Endpoints from legacy pages without an OpenAPI block are missing.
