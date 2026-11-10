# Bouncer

Bouncer email verification: real-time single-email verification, domain checks,
asynchronous batches (create, status, results, finish, delete), the synchronous
batch endpoint, toxicity list jobs and the credit balance (13 tools).

## Interface

Hand-written tools over Bouncer's REST API at `https://api.usebouncer.com`
(`/v1.1/...` and `/v1/toxicity/...`), following the official docs at
<https://docs.usebouncer.com/llms.txt>. Bouncer's OpenAPI document exists only
embedded in its docs pages (the `openapi.yml` link in `llms.txt` returns 404) and
Bouncer offers no MCP server or GraphQL API, so there is no stable public spec to
compile.

## Auth

API key only. Bouncer has no OAuth. Create a key in the Bouncer dashboard via the API menu, Generate API Key
(<https://app.usebouncer.com>); it is sent as the `x-api-key` header.
The health check calls the free `GET /v1.1/credits` endpoint.

## Notes and gaps

- Verification calls spend credits. Batch, sync-batch and toxicity creation,
  finish and delete require approval. Real-time email verification is a GET that
  spends one credit; it is a query, so it is not gated by approval (a deliberate
  choice; add `always()` to `verifyEmail` to gate per-call credit spend).
- Bouncer's plain-text/CSV batch upload and CSV download are not exposed; emails
  are passed as JSON lists.
- Batch create sends emails as `{email}` objects per the vendor example, although
  the vendor schema declares the body as a string.
- Rate limits: the credits endpoint (`GET /v1.1/credits`, also used by the health
  check) allows 10 requests per minute; toxicity list creation 10 lists per
  minute; batch creation 60 per minute and other batch endpoints 200 requests per
  minute; real-time verify 1000 per minute.
