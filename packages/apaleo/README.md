# Apaleo

Apaleo property management: reservations, bookings, groups and blocks, folios, charges, payments and invoices, properties, units and unit groups, rate plans and rates, availability, housekeeping and maintenance, settings, reports and logs. 289 tools across ten API areas (booking 77, finance 65, rateplan 45, inventory 35, settings 35, operations 10, availability 7, account 6, reports 5, logs 4), exposed as one router per area.

## Interface

OpenAPI, from Apaleo's own Swagger 2.0 documents, one per area at `https://api.apaleo.com/swagger/<area>-v1/swagger.json` (index at https://api.apaleo.com/swagger/index.html). The `-v0-nsfw` (not safe for work, i.e. unstable) documents are not used. The documents declare no host; every call goes to `https://api.apaleo.com`.

Apaleo also runs an official remote MCP server (`https://mcp.apaleo.com`, OAuth, github.com/apaleo/mcp). Its tool set is narrower (reservations, folios, invoices, rates, availability), so the OpenAPI documents were chosen: they cover all ten areas with 289 tools. Use the MCP server instead if you only need those read-oriented workflows.

Apaleo's generic action schemas have names such as `ActionModel[ReservationAction,NotAllowedReservationActionReason]` that the compiler cannot resolve as references. `patches.ts` replaces those references with a plain object schema (response bodies only; request validation is untouched). Without it, core reads such as listing properties, units and reservations are dropped.

`scripts/check.sh apaleo` compiles only the `options` export (booking, 77 tools). To compile every area run `node packages/apaleo/tools.ts`: 289 tools (150 mutations), 0 skipped across booking 77, finance 65, rateplan 45, inventory 35, settings 35, operations 10, availability 7, account 6, reports 5, logs 4.

## Auth

OAuth 2.0 authorization code with refresh tokens, discovered from `https://identity.apaleo.com` (OIDC metadata). Per Apaleo's guide (https://apaleo.dev/guides/oauth-connection/register-connect-client-app.html), sign in as a user with administration privileges, open Apps > My store apps > Add a new store app, and enter the Executor redirect URI under "Apaleo Connect: redirect URIs" (Apaleo requires https). The form has no grant-type field; the authorization code flow is implied by the redirect URI, so there is no "authorization code" option to pick. Scopes requested cover the tools above without `admin`, `reservations.force-*`, `properties.create` or account suspension scopes. Mutations always require approval.

## Known gaps

- No client-credentials account: Executor's OAuth flow is authorization code only. Apaleo's OIDC metadata lists `client_credentials` as a supported grant (and https://apaleo.dev/guides/oauth-connection/simple-client.html documents it), but this package does not offer it. The scope list can be trimmed when you create the client.
- Skipped: the unstable `v0-nsfw` APIs (data, taxes, company, calendar), and the Webhook/Notification and Payment-gateway APIs, which are separate services outside `api.apaleo.com/swagger`.
- Icon exception: Apaleo publishes no vector brand kit (apaleo.com and apaleo.dev serve PNG logos only; Simple Icons has no entry). The icon is `nodes/Apaleo/apaleo.svg` from Apaleo's own GitHub org (`apaleo/n8n-nodes-apaleo`), an SVG that wraps the official mark as an embedded PNG on its dark #030B24 square. It is visible on light and dark backgrounds because it carries its own background; one variant (no light/dark split) is used because the previous dark variant turned the tile white. Replace it if Apaleo publishes a vector mark.
