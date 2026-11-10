# Circle

Manage a Circle (circle.so) community: members, member tags and segments, spaces and space groups, posts, comments, events, courses and lessons, access groups, paywalls, subscriptions and charges, messages, and more.

Interface: OpenAPI, from Circle's official Admin API v2 document at https://api-headless.circle.so/api/admin/v2/swagger.yaml (170 tools, 105 of them mutations; 1 operation is skipped for a missing component reference). Calls go to `https://app.circle.so/api/admin/v2`. Circle's document lists a second `host` header scheme for local development on every operation; `openapi.ts` patches it out so only the token is sent.

## Auth

- Admin API v2 token (`apiKey`): in your community, open Settings, Developers, Tokens, create a token of type "Admin V1 or V2", and paste it. It is sent as `Authorization: Token <token>`. API access requires a Circle Business plan or above.

There is no OAuth: Circle does not offer user-created OAuth apps for the Admin API.

## Known gaps

- Only the Admin API v2 is covered. The Headless Member API and Headless Auth API (member-scoped tokens) and the Data API are not exposed.
- Only communities on the hosted `app.circle.so` domain are reached; the token is community-specific.
- Icon: Circle's official favicon-style app mark (200px PNG) from https://circle.so/brand-guidelines.
