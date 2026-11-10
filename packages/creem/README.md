# Creem

Creem is a merchant-of-record payments platform. This package covers products,
checkouts, customers and billing portal, subscriptions (cancel, pause, resume,
upgrade), licenses, discounts, transactions, refunds, stats, customer credits,
usage meters and events, affiliates and splits.

**Interface:** Creem's official OpenAPI document,
<https://docs.creem.io/api-reference/openapi.json>, mounted live. Mutations
and the webhook signing secret read require approval.

**Auth:** API key only (Creem has no OAuth). Create it in the Creem dashboard
under the Developers section (per the API reference introduction). It is sent as the `x-api-key` header to
`api.creem.io`.

**Gaps:** Only the production host (`api.creem.io`) is wired up. Test-mode keys
only work against `test-api.creem.io`, which this package does not target.
Webhooks are not covered (they are inbound).
