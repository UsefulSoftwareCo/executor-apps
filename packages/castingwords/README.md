# CastingWords

Order and manage human-powered transcripts with CastingWords: place orders for public media URLs, check audiofile state, fetch transcripts (txt, html, srt, vtt and more), order upgrades, cancel and refund, read invoices and the prepay balance, and manage the account webhook.

**Interface:** hand-written tools over the official Store API v4 (`https://castingwords.com/store/API4`, reference at https://castingwords.com/docs/developer/SimpleAPI.html). CastingWords publishes no OpenAPI document and no remote MCP server, so the documented operations are wrapped directly as 10 tools. Every mutation (order, upgrade, refund, webhook changes) requires approval.

**Auth:** API key. Find it at https://castingwords.com/customer/info. The API has no OAuth. The key is sent as `api_key` (query string on GET; URL-encoded form body on POST, with repeated keys for `url`, `sku` and `name`, as the docs show).

**Icon:** the waveform mark from CastingWords' own `safari-pinned-tab.svg` (https://castingwords.com/safari-pinned-tab.svg); the mark is not in Simple Icons.

**Known gaps:** responses are returned as free-form JSON. Incoming webhooks (events CastingWords posts to your URL) are not handled, only registration and test. Orders cost money; use `test=1` for dry runs. There is no listing endpoint for orders or audiofiles in the API.


**Known ambiguity:** the vendor docs list the invoice call as POST in the overview but GET in the detail section; this package uses GET.
