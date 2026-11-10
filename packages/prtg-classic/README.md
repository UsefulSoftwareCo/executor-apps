# PRTG Classic

Paessler PRTG Network Monitor (self-hosted): list and inspect sensors, devices, groups, probes, channels, messages, tickets, schedules and reports, read live status and historic data, and run pause, resume, scan now, acknowledge alarm, priority, rename, property, duplicate and delete actions. PRTG is installed on the user's own server, so every account carries its host.

## Interface

Hand-written tools over PRTG's HTTP API (`/api/table.json`, `/api/getsensordetails.json`, `/api/historicdata.json`, `/api/pause.htm`, `/api/scannow.htm` and so on), documented at https://www.paessler.com/manuals/prtg/application_programming_interface_api_definition. Paessler publishes no OpenAPI document or MCP server for PRTG. Mutations ask for approval.

## Auth

API token (`apiKey`): in PRTG open Setup > My Account > API Keys and create a key; enter it with the server host (for example `monitor.example.com` or `host:8443`). The token is sent as the `apitoken` query parameter over HTTPS. Because the host differs per account, the provider declares no static `hosts`, so the token is handled by the app, which only sends it to the account's own host. The health check reads one sensor row from `/api/table.json`. OAuth is not offered by PRTG.

## Known gaps

- Adding sensors, devices and groups (`addsensor`, `adddevice`) and the sensor tree XML are not exposed.
- Action endpoints answer with a redirect, so they return `{ ok: true }` without the new state; read it back with the list or get tools.
- PRTG servers must be reachable over HTTPS from Executor.
- This covers PRTG's Classic API; the newer PRTG API v2 is a separate product surface.
