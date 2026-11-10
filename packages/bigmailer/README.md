# BigMailer

Email marketing with BigMailer: brands, contacts (single, upsert and batch), lists, fields, templates, senders, connections, bulk, transactional and automation campaigns, suppressions, webhooks and users. 80 tools, 45 of them mutations that require approval.

## Interface

OpenAPI, from the vendor's own reference at https://docs.bigmailer.io/reference. BigMailer does not publish one whole-API document: each reference page embeds the OpenAPI 3.1 definition for its single operation (indexed at https://docs.bigmailer.io/llms.txt). `openapi.json` is those 80 official definitions merged unchanged (paths and components unioned, plus one top-level security requirement for the API key scheme). Reproduce it with `node packages/bigmailer/regenerate-openapi.mjs` (writes the file) or `--check` (verifies the committed paths and components against the 80 live pages listed in the llms.txt index). The API base is `https://api.bigmailer.io/v1`.

## Auth

API key only (BigMailer has no OAuth). Create a key in BigMailer under account settings, API keys; it is sent in the `X-API-Key` header. The account health check calls `GET /v1/me`. The API allows 10 requests per second and 4 concurrent requests per account.

## Known gaps

None known: all 80 documented operations compile, with none skipped. Operations on the same brand need its `brand_id`, which `List brands` returns.
