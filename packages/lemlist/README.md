# lemlist

Run multichannel outreach with lemlist: campaigns, leads, sequences, enrichment, inbox, schedules, webhooks and team.

## Interface

OpenAPI, from lemlist's official v2 document at https://developer.lemlist.com/api-reference/openapi/v2.json (server `https://api.lemlist.com/api`). 187 tools, 2 operations skipped by the generator (`schema_reference`). lemlist also runs a remote MCP server at https://app.lemlist.com/mcp (OAuth or `X-API-Key`); the OpenAPI document exposes more tools, so it is used instead.

## Auth

- **API key**: in lemlist, open Settings, Integrations, and click "Generate a new API key". It is sent as the HTTP Basic password with an empty username. lemlist does not offer user-created OAuth apps for the REST API, so there is no OAuth method.

Mutations require approval.

## Known gaps

- The icon is the lemlist app mark from lemlist's own site (`app.lemlist.com/lemapp-next/lemlist-logo.svg`); Simple Icons has no entry.
- The health check uses `GET /team` and only asserts a successful JSON response; the vendor's Team schema declares no required fields, so no body field is decoded.
- The vendor marks these operations `deprecated: true` in the spec; they are still exposed as tools: `GET /campaigns/{campaignId}/export/leads`, `POST /campaigns/{campaignId}/leads/{leadIdOrEmail}/steps/{stepId}/skip`, `GET /tasks`, `GET /unsubscribes`, `GET /unsubs/export`, and `GET`/`POST`/`DELETE /unsubscribes/{email}`. Prefer their non-deprecated replacements where one exists.
