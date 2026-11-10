# PocketSmith

Personal finance: users, accounts, transaction accounts, institutions, transactions, categories, budgets, events, attachments, saved searches and currencies from PocketSmith.

**Interface:** OpenAPI 3, PocketSmith's official spec at https://raw.githubusercontent.com/pocketsmith/api/master/openapi.json (the document behind https://developers.pocketsmith.com), mounted live against `https://api.pocketsmith.com/v2`.

**Auth:** developer key (`X-Developer-Key`). Create a developer key in your PocketSmith account settings (see https://developers.pocketsmith.com; the vendor docs do not spell out the menu path) and paste it when connecting. Mutations require approval.

**MCP:** the official OAuth MCP server (`https://mcp.pocketsmith.com/mcp`, full access) is mounted under the `mcp` key as a second account type, using OAuth discovery and dynamic client registration. It adds capabilities the REST spec lacks: insight tools (financial health snapshot, cash flow and net worth forecasts, recurring expense detection), data feed connection status and refresh, deep links and account display order. Non-read-only MCP tools require approval. The read-only server (`https://mcp-readonly.pocketsmith.com/mcp`) is not mounted since the full server includes its tools.

**Gaps:** PocketSmith's REST OAuth 2 requires registering an app by emailing api@pocketsmith.com, so it cannot be completed by a normal user and is not offered; use a developer key. The official spec omits some newer endpoints (e.g. data feeds), which the MCP covers.

**Icon:** the mark is the shield sub-path of the vendor wordmark SVG (https://www.pocketsmith.com/assets/images/logo/pocketsmith.svg), not the full wordmark.
