# Fleetio

Fleet management with Fleetio: vehicles, equipment, work orders, service entries, inspections, fuel and meter entries, issues, parts, vendors, contacts, purchase orders, webhooks and more. 308 tools (173 mutations, each requiring approval).

## Interface

OpenAPI, from Fleetio's own developer documentation (https://developer.fleetio.com, base URL `https://secure.fleetio.com/api`). Fleetio publishes no downloadable OpenAPI file, but the docs site is generated from one and each operation page embeds its definition. `document.json` is those definitions for the current docs version (2025-05-05) merged into one document, with only 2xx responses kept. It is vendor data, but reassembled by us rather than a file Fleetio hosts; regenerate it when Fleetio ships a new API version.

## Auth

API key plus account token. Both are required on every request.

1. In Fleetio open Settings, then Manage API Keys (https://secure.fleetio.com/api_keys).
2. Create an API key. Its API version is fixed when you create it.
3. Copy the account token shown at the bottom of the same page.

Enter both in Executor. They are sent as `Authorization: Token <key>` and `Account-Token: <token>`.

## Known gaps

- OAuth 2.0 is not offered: Fleetio's quick-start documents only API key plus account token.
- Integrator tokens (higher rate limits) are not supported.
- Every request is sent with `X-Api-Version: 2025-05-05` (the version the tools are generated from), overriding the version your key is locked to.
- Partner-only operations are omitted: `POST /accounts` and `DELETE /accounts/{id}` need an Organization or Partner Token. The `Partner-Token` and `Organization-Token` header inputs are removed from contacts create/update; `account_membership_attributes` on those still requires a partner token and will be rejected for normal keys.
- Regeneration: no hosted OpenAPI file exists (developer.fleetio.com/openapi.json, /openapi.yaml and secure.fleetio.com/api/openapi.json return 404). Rebuild `document.json` by merging the definitions embedded in each operation page of https://developer.fleetio.com/docs/api, keeping 2xx responses, then re-apply the two patches above. No integrations.sh record exists. No official Fleetio MCP server was found in the github.com/fleetio org or by search.
