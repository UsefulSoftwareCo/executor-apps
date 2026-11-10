# DeskTime

Automatic time tracking from DeskTime: company account settings, all employees' daily
tracking data (arrival, online, productive time), a single employee's data with project
and app breakdowns, projects and tasks, creating projects, and starting or stopping
project timers.

## Interface

DeskTime publishes no OpenAPI or MCP server, so the 11 tools are hand-written `fetch`
calls against the documented REST API at `https://desktime.com/api/v2/json`
(help center: https://help.desktime.com/hc/en-us/sections/25494426310045, which could not be fetched
programmatically; the `X-API-Key` header and base URL were confirmed by live probes: a dummy key sent as
`X-API-Key` returns "API Key is invalid", while Bearer and `api_key` variants return "API Key is missing").
A spec search found nothing: `/api/openapi.json`, `/api/docs`, `/mcp` and `/.well-known/mcp.json` on
desktime.com return 404. The key goes in the `X-API-Key` header. Creating, starting and stopping projects are mutations and require approval.

## Auth

API key only (DeskTime has no OAuth). Copy the key from https://desktime.com/app/api
(Settings, API). The key belongs to one user; account-wide calls such as the employee list need
that user to have the matching permission in DeskTime.

## Known gaps

The documented API is read-mostly: no editing or archiving projects, no manual time entries, and
no webhooks. `start`/`stop` match projects and tasks by name, as DeskTime does. The API's JSONP
and PLIST output formats are not exposed.
