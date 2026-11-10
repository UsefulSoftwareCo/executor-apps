# NoCRM.io

noCRM.io lead management: leads (create, update, assign, duplicate, delete), comments, attachments, post-sales follow-ups, pipeline steps, client folders, tags, custom fields, users, teams, prospecting lists and prospects, and webhooks. 72 tools.

## Interface

Hand-written tools over the official noCRM.io API v2 (https://www.nocrm.io/api). noCRM.io publishes no OpenAPI document, so each documented endpoint is declared in `index.ts`. The API host is per account (`https://{subdomain}.nocrm.io/api/v2`). Writes take a `body` with the parameters the vendor documents; lists page with `limit` and `offset`.

## Auth

API key only. An admin creates the key in the noCRM.io account's admin section (one key per application, revocable); it grants admin rights (a request without a user acts for the account, not a specific user). Enter the account subdomain (the `acme` in `acme.nocrm.io`; only lowercase letters, digits and hyphens are accepted) and the key; it is sent in the `X-API-KEY` header. The vendor has no OAuth. User tokens (`X-USER-TOKEN`, 30-day) exist but are not offered.

## Gaps

- Not covered: partner-only endpoints (partners, email signature, VoIP, deprecated call logging; need `X-API-PARTNER-KEY`), multipart attachment upload, and the GET-only Simplified API under `/api/simple`.
- The vendor allows 2000 requests per day per account and may ban keys that mishandle 4XX errors.
- `users.create` makes noCRM.io try to charge the account for the remaining days of the billing cycle before creating the user. `users.sendActivationEmail` (a GET upstream) is treated as a mutation because it sends email.
- Prospect `content` and `fields` must be JSON-encoded strings, as the vendor documents.
- Some endpoints depend on the plan (the `field_key`/`field_value` lead filters need Expert, send email needs Dreamteam, teams need the Teams feature).
- The icon is the vendor's 180px app icon; no SVG mark is published. Mutations require approval.
