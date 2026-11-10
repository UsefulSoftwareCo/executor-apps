# Better Proposals

Create, send and track proposals in Better Proposals: proposals (listed by stage: new, sent, opened, signed, paid), templates, document types, quotes, companies, currencies, brands and merge tags. 25 tools.

**Interface:** hand-written tools over the official REST API at `https://api.betterproposals.io`, documented at https://betterproposals.io/resources/api/. The vendor publishes no OpenAPI document or MCP server, so each endpoint is a `fetch` call. POST bodies are form-encoded, as the API requires.

**Auth:** API key only (the API has no OAuth). Generate it in Better Proposals under Integrations > API (https://betterproposals.io/2/integrations/api/); it is sent as the `Bptoken` header. API access needs a Premium or Enterprise plan once the trial ends. The account check reads `/settings`.

**Approvals:** every create tool asks for approval.

**Known gaps:** the vendor documents no request fields for cover, quote and company creation, so those tools take a free-form `fields` object. The API documents no pagination, filters, update or delete endpoints, so none are exposed.

Quotes are unverified: the vendor's Quotes section is placeholder text ("Some text for quotes here.") and is missing from its navigation, so `quotes.list`, `quotes.get` and `quotes.create` follow the listed endpoints but their behaviour is not documented.

**Response handling:** every response is a `{status, data|message}` envelope. The account check and all tools fail unless `status` is `success`, so an error envelope returned with HTTP 200 is not treated as a result.

**Tax encoding:** `Tax` is sent as `1`/`0`. The docs only say "bool"; their PHP example passes `true` through `http_build_query`, which emits `1`, and PHP would read the string `false` as truthy. No wire sample is documented, so this is inferred.
