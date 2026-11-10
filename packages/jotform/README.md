# Jotform

Build forms and read, create and manage their questions, properties, submissions, reports, folders and webhooks in Jotform (44 tools).

## Interface

Hand-written tools over the Jotform REST API at `https://api.jotform.com` (or the EU and HIPAA hosts, chosen by the account's region) (reference: https://api.jotform.com/docs/). Jotform publishes no OpenAPI document, so the tools follow the documented endpoints and the official client libraries. Jotform also runs a hosted MCP server at `https://mcp.jotform.com` (OAuth), but it exposes fewer operations than the REST API. All mutations require approval.

## Auth

- API key: create one at https://www.jotform.com/myaccount/api (Settings, API). It is sent as the `APIKEY` header. Enter the region `us` (api.jotform.com), `eu` (eu-api.jotform.com) or `hipaa` (hipaa-api.jotform.com) to match where the Jotform account lives.

The REST API docs document only API keys and do not offer OAuth, so only the API key is offered.

## Known gaps

- User registration, login and logout endpoints are omitted.
