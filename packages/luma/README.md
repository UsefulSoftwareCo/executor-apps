# Luma

Manage events on [Luma](https://luma.com) (lu.ma): events, guests and invites, hosts, ticket types, coupons, email blasts, calendars, calendar admins, contacts and event submissions. This is the events platform, not Luma Labs (see `lumalabs`).

## Interface

OpenAPI. Luma's official OpenAPI 3.1 document at https://public-api.luma.com/openapi.json (linked from https://docs.luma.com/reference/getting-started-with-your-api), server `https://public-api.luma.com`. Every mutation requires approval.

## Auth

API key only; Luma offers no OAuth for user-created apps. Keys are scoped to a single calendar and require a Luma Plus subscription. Create one at https://luma.com/calendar/manage/api-keys and paste it as the API key; it is sent in the `x-luma-api-key` header. Add one account per calendar.

## Known gaps

- Luma Plus is required for API access.
- The health check calls `GET /v1/users/get-self`.
