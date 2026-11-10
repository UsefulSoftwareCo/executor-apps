# Mixpanel

Mixpanel product analytics: run insights, funnels, retention and flows queries, browse
events, properties, cohorts, dashboards and reports, and manage data definitions from
Mixpanel's hosted MCP server.

Interface: Mixpanel's official remote MCP servers, US `https://mcp.mixpanel.com/mcp`,
EU `https://mcp-eu.mixpanel.com/mcp` and India `https://mcp-in.mixpanel.com/mcp`
(docs: https://docs.mixpanel.com/docs/mcp). The vendor docs list 64 tools (analytics, dashboards, data discovery and management,
cohorts, metrics, lookup tables, replays, plus Beta experiments, feature flags and audit log);
the live list depends on the account. Tools appear under
`us`, `eu` or `in`, matching the data residency of the account you connect. Mixpanel's REST
APIs (ingestion, query, export, lexicon) have no official OpenAPI document found at a stable
URL, so the MCP servers are the interface.

Auth, one account type per region (`Mixpanel`, `Mixpanel (EU)`, `Mixpanel (India)`):

- OAuth (`oauth`): each server publishes OAuth metadata and supports dynamic client
  registration, so Executor registers its own client; no manual OAuth app is needed.
  Mixpanel documents no redirect URI requirements. The package requests the documented
  mandatory scopes (`projects analysis events insights segmentation retention data:read
  funnels flows data_definitions`) plus the optional `dashboard_reports bookmarks
  user_details business_context`; the Beta scopes (experiments, feature flags, audit log)
  are not requested. Sign in with a Mixpanel user that has access to the target projects.
- Service account (`serviceAccount`, Beta): a static header with no browser login, for
  automation. Enter the service account username and secret; the package base64-encodes
  `username:secret` and sends `Authorization: Bearer Basic <base64>`, as the MCP docs
  specify. Creating a service account needs Owner or Admin permission (Settings, Service
  Accounts); the secret is shown once. The account only reaches projects it was added to.
- An org admin must enable MCP in Settings, Org, Overview for either method.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: service account access to the REST APIs (ingestion, query, export) is not offered; service
accounts work only against the MCP servers. Account
health only verifies the token reaches the MCP server. The icon is the Mixpanel mark from
Simple Icons.
