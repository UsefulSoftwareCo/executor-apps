# Postmark

Send and track transactional email with Postmark. Covers sending (single and batch, with templates), template management, bounces, message search and details, inbound, statistics, webhooks, suppressions and message streams (43 tools, mounted under `server`), plus servers, domains, sender signatures and data removal (23 tools, mounted under `account`).

## Interface

OpenAPI (Swagger 2.0), the two official documents Postmark publishes:

- Server API: https://postmarkapp.com/swagger/server.yml
- Account API: https://postmarkapp.com/swagger/account.yml

The documents declare no URL scheme, so `openapi.ts` pins the base URL to `https://api.postmarkapp.com`. Every mutation requires approval.

## Auth

Postmark uses two separate header tokens, so there are two methods; add the ones you need.

- **Server API token** (`X-Postmark-Server-Token`): Postmark > your server > API Tokens. Enables the `server` tools. It operates only on that one server.
- **Account API token** (`X-Postmark-Account-Token`): Postmark > account menu > API Tokens. Enables the `account` tools.

There is no OAuth. The health check reads `GET /server` (server token) or `GET /servers` (account token).

## Known gaps

The Account API document is marked version 0.9.0 by Postmark and may lag the live API. Postmark's separate MCP server is not used.
