# Zoom

Covers the Zoom REST API: Meetings, Users, Accounts, Phone, Team Chat, Rooms, Events, Contact Center, Calendar, Mail, Whiteboard, Scheduler, Clips, Number Management, Video SDK, SCIM2, Quality and Workforce Management, Auto Dialer, Tasks, Marketplace, Commerce, Healthcare, QSS, Virtual Agent, IQ, AI Services, Chatbot and Hub. About 1,900 tools, one router per product. Mutations require approval.

## Interface

Zoom's official OpenAPI documents, one per product, at `https://developers.zoom.us/api-hub/<product>/methods/endpoints.json` (for example `.../meetings/methods/endpoints.json`). All are served from `https://api.zoom.us/v2`. The documents' own security schemes have empty OAuth URLs, so the package redeclares them as bearer tokens.

## Auth

- OAuth (authorization code): create a General (user-managed) OAuth app in the [Zoom App Marketplace](https://marketplace.zoom.us/) under Develop > Build App. Add the Executor redirect URI shown on the connect page to the app's redirect URL allow list, and add the scopes you need on the app's Scopes page. Zoom uses the scopes configured on the app, so none are requested in the sign-in URL. Paste the Client ID and Client Secret on the connect page. Tokens are renewed automatically.

## Known gaps

- Server-to-Server OAuth (`account_credentials` grant with an account ID) is not offered: the framework's client-credentials grant cannot send the per-account `account_id`. Zoom has no long-lived API token.
- Operations needing scopes your app lacks fail at call time; calls only succeed for products the Zoom plan includes.
- Skipped operations: a few documents have one invalid path each (Phone, Chat, Rooms, Virtual Agent, IQ) and Rooms and Events have operations on other hosts (`multiple_hosts`).
- Not available as OpenAPI (404): Zoom Docs, Workplace, Webinars (covered by Meetings and Events), Revenue Accelerator, Information Barriers. Zoom also runs an OAuth MCP server at `https://mcp.zoom.us/mcp/zoom/streamable` and a beta GraphQL API, not used here.
- Spec documents are fetched live and unpinned, so tool names can shift when Zoom updates them.
- Disconnecting does not revoke the token at Zoom (revocation is omitted; Zoom documents a query-string revoke call the host does not make). The connect flow has not been exercised live against Zoom.
