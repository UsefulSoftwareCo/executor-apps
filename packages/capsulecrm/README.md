# Capsule CRM

Contacts (people and organisations), opportunities, projects, tasks, notes and
entries, pipelines and milestones, boards, tracks, users, saved filters, custom
field definitions and webhooks in Capsule CRM, plus a `request` escape hatch for
any other v2 endpoint.

Interface: hand-written tools over Capsule's REST API v2 (`https://api.capsulecrm.com/api/v2`,
docs at https://developer.capsulecrm.com/). Capsule publishes no official OpenAPI document
(only third-party skeletons), GraphQL API or MCP server, so the tools are written by hand
(70, including a `request` escape hatch). Paths and parameters follow the official docs.

Auth:

- Personal API token (`token`): create one in Capsule under My Preferences > API
  Authentication Tokens. Sent as a bearer token.
- OAuth (`oauth`): Capsule publishes no metadata or dynamic registration, so create an OAuth
  app at `https://developer.capsulecrm.com/clients/new` (the developer site, GitHub login; the
  app is created there, not per subdomain, as a web application so it gets a client secret) and enter its client ID and secret on the connect page. Set the app's redirect URI to
  Executor's redirect URI shown on the connect page; it must match exactly. Scopes requested:
  `read write` (the `user_preference` scope is not requested).

Approvals: every mutation asks for approval.

Known gaps: saved-filter result queries (`/parties/filters/results`), attachments and some
less common endpoints are reachable only through `request`. Request and response shapes are
passed as JSON, not typed.
