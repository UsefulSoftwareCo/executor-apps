# Heights Platform

Heights Platform (online courses, digital products and communities): account info, courses and lessons, bundles, digital products, unified product search and update, community channels and posts, orders, students, and student access management (enroll, revoke, roles, progress reset). 36 tools.

## Interface

Hand-written tools over the official Heights Platform API v1, documented at https://www.heightsplatform.com/api. Heights publishes no OpenAPI document, so each documented endpoint is declared in `index.ts`. The API host is per account (`https://{subdomain}.heightsplatform.com/api/v1`). Write tools take either named inputs or, for resources with nested payloads, a `body` sent as JSON. Every mutation requires approval; `courses.completionPercentage` is a POST that only reads and does not.

## Auth

API key only. Heights documents no OAuth. Use an admin user's API key (Account Settings, Custom Code tab) and your account subdomain (the `academy` in `academy.heightsplatform.com`). The key is sent as `Authorization: Bearer <key>`, which the vendor accepts alongside `Token token=<key>`. Non-admin keys get 403.

## Gaps

- Webhooks are managed in the Heights admin UI (Account Settings, Integrations, Webhooks), not through the API.
- Custom-domain accounts must still use the `*.heightsplatform.com` subdomain.
- Request bodies are passed through and not validated by the tool.
- Rate limit is 60 requests per minute (300 on Academy plans).
- Body shapes follow the vendor docs and were not exercised against a live account.
