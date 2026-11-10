# eSputnik

eSputnik omnichannel marketing automation: account and organization info,
contacts (search, get, upsert, delete), segments, events, message sending
(email, SMS), templates, workflows and analytics, depending on the auth method.

Two interfaces, one per auth method:

- REST API key: ten hand-written tools over the documented REST API at
  `https://esputnik.com/api` (https://docs.esputnik.com/reference/getting-started-with-your-api):
  account info, balance, search/get/upsert/delete contacts, list segments, send
  email, send SMS and generate event (v3). eSputnik publishes no complete
  OpenAPI document, so these are the highest-use operations only.
- OAuth: eSputnik's official remote MCP server, `https://mcp.esputnik.com/`
  (https://docs.esputnik.com/reference/esputnik-mcp-server). The docs list about
  80 tools (contacts, segments, events, templates, mobile push, app inbox, SMS,
  workflows, sending, analytics, media); the server lists the real set per account.

Auth:

- API key (`apiKey`): create it under profile, Settings, API, New key, and pick
  the access rights (full access or a limited preset). Requests use HTTP Basic
  with any username and the key as the password. Keys unused for 90 days are
  disabled. This is the method to use if you are unsure about OAuth.
- OAuth (`oauth`): the MCP server uses OAuth 2.0 with dynamic client
  registration (PKCE S256), scope `esputnik.api`; the user signs in with their
  eSputnik account in the browser. The vendor docs describe the MCP connector as
  a research preview available for Claude Code and Claude Cowork. Whether other
  MCP clients such as Executor may register has not been confirmed with
  eSputnik, and no live OAuth round trip was run, so this method may be refused.

Approvals: every REST mutation and every MCP tool not marked read-only asks for approval.

Known gaps: REST tools cover only the operations above (no templates, workflows,
broadcasts, mobile push or analytics). eSputnik's separate OAuth for the REST API
needs a partner-registered client, which Executor cannot supply, so it is not
offered. Not verified against a live account.
