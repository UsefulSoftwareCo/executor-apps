# Quo

Quo (formerly OpenPhone) is a business phone platform. This package exposes the
public API (2026-03-30 generation): calls with recordings, summaries, transcripts and voicemails,
text messages, contacts and custom fields, conversations, tasks, users, phone
numbers and webhooks.

Interface: OpenAPI, the vendor's official 2026-03-30 document at
https://openphone-public-api-prod.s3.us-west-2.amazonaws.com/public/openphone-public-api-2026-03-30-prod.json
(57 operations). Every request carries `Quo-Api-Version: 2026-03-30`. It adds
organization, phone number search and user assignment, contact notes,
properties and shares, task status/due date/users, message retry and webhook
events (list, test, retry, rotate) over v1. The spec's
`GET /phone-numbers/available` names a `bearerAuth` scheme that the spec never
defines; this package maps it to the same raw Authorization key. Quo also
publishes an official remote MCP server at https://mcp.quo.com/mcp (15 tools,
OAuth); it is not used because the REST API is broader.

Auth: API key only. A workspace owner or admin creates it under workspace
settings, API tab, in Quo. The key is sent as the raw `Authorization` header
value, without a `Bearer` prefix. The remote MCP server uses OAuth, but the
REST API has no user-created OAuth apps.

Known gaps: sending text messages to US numbers requires US carrier
registration on the Quo side.
