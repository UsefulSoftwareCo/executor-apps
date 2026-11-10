# Pingdom

Covers the Pingdom API 3.1: uptime checks, check results and summaries, probes, alerting actions and contacts, maintenance windows, credits, reports and transaction (TMS) checks. 50 tools, 21 of them mutations (each requires approval).

Interface: OpenAPI, Pingdom's official document at https://docs.pingdom.com/api/API_3.1.yaml, served from `https://api.pingdom.com/api/3.1`.

Auth: API token (`apiKey`), sent as a bearer token. Create an API token in your My Pingdom account's API settings (the path was not confirmed against a vendor page). Write tools need a token with write access. The spec defines no OAuth, so there is no OAuth method. The health check calls `/credits`.

Known gaps: the spec declares no security schemes, so the bearer scheme is supplied in `openapi.ts`.
