# Iterate

Covers Iterate's customer-feedback REST API: list and read surveys, survey stats, individual responses and per-user response groups, recipient management and sending email surveys, and privacy tools (search, anonymize and delete users, singly or in bulk). 13 hand-written tools.

## Interface

Custom tools over the REST API at `https://iteratehq.com/api/v1`. Iterate publishes no OpenAPI document; the endpoints come from the official API reference at https://iteratehq.com/api-docs (previously https://iterate.docs.apiary.io).

## Auth

- API key (`apiKey`): create it in your Iterate account settings (the API reference at https://iteratehq.com/api-docs does not say where; check Iterate's help center). Sent in the `x-api-key` header to `iteratehq.com`.
- No OAuth: Iterate does not offer it.

## Notes and gaps

- Every tool that writes or deletes asks for approval. `sendSurvey` emails real people and cannot be undone; deletes are permanent.
- The user tools take a `companyId`; it is the `company_id` field of any survey from `listSurveys`.
- Pagination: pass the `page[cursor]` value from `links.next` as `cursor`.
- Every request sends `v=20161231`, the version parameter the API reference asks for (its example value). The reference lists no other endpoints, so there are no gaps against it.
