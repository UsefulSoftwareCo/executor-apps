# La Growth Machine

Drive a La Growth Machine workspace: campaigns, audiences, leads, enrichment, LinkedIn and email messages, inbox conversations, manual tasks, identities, members, credits and inbox webhooks.

Interface: OpenAPI, the vendor's official document at https://developers.lagrowthmachine.com/openapi.yaml (server `https://apiv2.lagrowthmachine.com/flow`).

## Auth

API key only (the API has no OAuth). Copy your key from La Growth Machine settings (see https://developers.lagrowthmachine.com/guides/quickstart/); it is sent as `Authorization: Bearer <key>`. The health check calls `GET /me`.

## Gaps

Every mutation requires approval. The vendor also offers `x-api-key` and query-string key variants; only the Bearer form is used.
