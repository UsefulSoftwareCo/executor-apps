# Scorecard

Scorecard is an evaluation platform for AI agents. This package covers projects, testsets, testcases, systems, metrics, metric groups, runs, records, scores, annotations, tags, assignees and attachments. It also covers the catalog target "Scorecard MCP".

Interface: Scorecard's official OpenAPI 3.1 document, `https://docs.scorecard.io/openapi.yaml` (server `https://api2.scorecard.io/api/v2`). Accounts that connect with OAuth instead use Scorecard's official remote MCP server, `https://mcp.scorecard.io/mcp`, whose tool list is whatever the server exposes.

Auth:
- API key (`apiKey`): create one in the Scorecard app under Settings, API Keys. Keys start with `ak_` and are sent as `Authorization: Bearer ak_...`. The health check lists one project.
- OAuth (MCP path): the MCP server publishes OAuth metadata (authorization server `https://clerk.scorecard.io`) and supports dynamic client registration, so no OAuth app is created by hand. The redirect URI is the one Executor shows on the connect page. The REST API does not accept these OAuth tokens in this package; OAuth accounts get the MCP tools.

Icon: Scorecard's official app icon (Webclip PNG from scorecard.io).

Known gaps: mutations on either path require approval; MCP tools marked read-only do not.
