# HighLevel

HighLevel (GoHighLevel, also white-labelled as LeadConnector) CRM and marketing automation: contacts, conversations and messages, calendars and appointments, opportunities, invoices, payments, products, workflows, forms, funnels, blogs, social planner, voice and conversation AI, locations, users and more. About 570 tools, one router per API area (`contacts`, `calendars`, `invoices`, ...). Most calls need a `locationId` (the sub-account).

## Interface

OpenAPI. HighLevel publishes one official OpenAPI document per API area in
https://github.com/GoHighLevel/highlevel-api-docs/tree/main/apps (base URL
`https://services.leadconnectorhq.com`). All 40 areas are mounted under their own key in one router, except `oauth`
(token exchange, which Executor does itself). `scripts/check.sh` compiles only the contacts spec; the full set
compiles to 573 tools with none skipped. The `Version` header each operation requires is part of its input.
HighLevel also runs an MCP server at `https://services.leadconnectorhq.com/mcp/`, but the REST API exposes far more operations.

## Auth

- **Private Integration Token** (`token`): in HighLevel, Settings, Private Integrations, create an integration, choose
  scopes (include `locations.readonly`, which the account check needs, plus the scopes of the areas you will use) and copy the token. Also enter the sub-account (location) id, used to check the token. Agency tokens work too:
  enter any location id of the agency.
- **OAuth** (`oauth`): create an app in the HighLevel Marketplace (marketplace.gohighlevel.com, My Apps), choose its
  scopes, add Executor's redirect URI as a redirect URL, and enter the app's client id and secret. Authorization uses
  `https://marketplace.gohighlevel.com/oauth/chooselocation` (white-label agencies use `marketplace.leadconnectorhq.com`;
  not covered). The check reads the `userType`, `locationId` and `companyId` fields of the token response and fetches that
  location (`locations.readonly`) or company (`companies.readonly`). The token response does not declare which
  type is issued by default: `user_type` is optional on the token exchange and Executor does not send it, so the
  token type is whatever HighLevel issues for the installation (the response's `userType` says which). The
  `Version` header is not sent on the token exchange (the official oauth spec declares none). Executor always sends a
  PKCE `code_challenge`; the vendor docs do not mention PKCE, so whether HighLevel
  ignores it is unverified.
  The requested scopes are every scope used by an operation in the mounted specs (113), excluding
  `locations.internal-access-only` (internal) and the Marketplace admin scopes `oauth.readonly`, `oauth.write`,
  `marketplace-installer-details.readonly` and `marketplace-external-auth-migration.write`, which are only for
  HighLevel's own app-management endpoints, not for a third-party app's tools. The app configured in the
  Marketplace still limits what is granted; a scope the app lacks makes tools in that area fail.

## Known gaps

- Only the v2 specs are mounted, not the `v3` copies in the same repository.
- The specs are fetched from the official repository at a pinned commit (`0af86a4`), not the mutable `main` branch; update `revision` in `openapi.ts` to pick up API changes.
- Tools of the excluded Marketplace admin endpoints (a few operations in the `marketplace` area) will fail with insufficient scope.
- White-label authorization host and user-type selection (Location or Company, `user_type`) at token exchange are not configurable.
