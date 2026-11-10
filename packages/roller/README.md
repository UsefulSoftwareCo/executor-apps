# ROLLER

Venue management for attractions and leisure venues: bookings (search, create, update, cancel), products, sessions and availability, capacity reservations, guests and waivers, gift cards, discounts, modifiers, companies, plus the read-only Reporting API (bookings, revenue, bulk exports, guests, venue configuration).

## Interface

OpenAPI, from ROLLER's own developer portal (https://docs.roller.app). The REST API (61 tools) and Reporting API (25 tools) are mounted under the `rest` and `reporting` groups of one router. The documents are the portal's bundled exports (`https://api.stoplight.io/projects/cHJqOjMxNDQ5NA/branches/master/export/reference/{rest-api,reporting-api}.yaml`); the portal is hosted on Stoplight, and ROLLER publishes no other stable URL for them. Mutations require approval.

## Auth

OAuth 2.0 client credentials. In ROLLER Venue Manager, generate API credentials (a client ID and client secret); see https://docs.roller.app/docs/api/getting-api-access. The app exchanges them at `https://api.roller.app/token` (JSON body) and reuses the bearer token, which lasts about 24 hours. No redirect URI is involved.

## Known gaps

- Production (`api.roller.app`) only; the playground at `api.play.roller.app` is not selectable.
- Webhooks and the OCTO API are not covered (webhooks are configured in ROLLER and delivered to your endpoint).
- The health check only confirms the credentials can mint a token; the APIs have no current-account endpoint.
