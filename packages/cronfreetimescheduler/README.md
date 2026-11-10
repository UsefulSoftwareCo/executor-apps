# Cronfree Time Scheduler

Creates recurring webhook schedules with Cronfree Time Scheduler: Cronfree POSTs to your URL at the weekdays, months, days, hours and minutes you choose, in a timezone you choose.

## Interface

Hand-written tools over Cronfree's documented REST endpoints (https://docs.cronfree.com/api.md): `schedules.create` (`POST https://login.cronfree.com/zapier/schedule`) and `schedules.remove` (`POST https://login.cronfree.com/zapier/unschedule`, body `{ hookUrl, license_key }`). Cronfree publishes no OpenAPI document, MCP server or GraphQL API.

## Auth

License key (`apiKey`). Sign in at https://cronfree.com (magic-link email), then copy the License Key from the dashboard. It is sent in the request body as `license_key` to `login.cronfree.com`. There is no OAuth.

## Known gaps

- Only `schedules.create` and `schedules.remove` are exposed. Cronfree's public docs describe no endpoint to list schedules (usage is viewed in the Cronfree dashboard), so none is guessed.
- There is no read-only endpoint, so the account has no health check; a bad key surfaces when a schedule is created.
- The docs list `timezone` as a string but show it as an array in the example; the tool sends a one-element array.
