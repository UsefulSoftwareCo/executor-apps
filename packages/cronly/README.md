# Cronly

Cronly monitors cron jobs, SSL certificates, servers and crontab back-ups. This package exposes 25 tools: company details, notifications, job monitors, projects, SSL certificate monitors, users, servers (including crontab-change alerts) and crontab back-ups.

**Interface:** hand-written tools over Cronly's REST API (`https://cronly.app/api`), documented at <https://docs.cronly.app/api/how-to-use-the-api>. Cronly publishes no OpenAPI document, GraphQL API or MCP server. Requests send `Authorization: Bearer <token>`; Cronly's docs write the header as `Authorization: Bearer: <API token>` (with a colon) and the how-to page does not name the header at all; the standard `Bearer <token>` form is used and is unverified against a live key. Cronly documents failures as HTTP 200 with `status: "error"` and a `reason` (some endpoint pages show 404 with `{"error": ...}`); the tools turn either shape into an error. DELETE calls treat any 2xx, including an empty 204, as success.

**Auth:** API token only (`apiKey`). Create it in the Cronly dashboard (<https://cronly.app>). Cronly offers no OAuth. Credentials go only to `cronly.app`. Every mutation requires approval.

**Gaps:** The unauthenticated pulse (heartbeat) endpoint `GET /api/monitors/pulse/{token}` is not a tool; call it from the job itself. Creating a back-up must come from the IP address configured on the server. Notification, monitor and user schemas are documented only by example, so results are returned as raw JSON. The API docs date from 2022-2024.
