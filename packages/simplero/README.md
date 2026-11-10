# Simplero

Covers the Simplero marketing platform for course creators and coaches: customers, products, lists, funnels, automations, affiliates, events, assets, blocks and more (868 operations, 652 of them mutations).

**Interface:** OpenAPI 3.1, Simplero's official v2 document at https://simplero.com/api/v2/docs/openapi.json (docs: https://simplero.com/api/v2/docs). All operations compile; none are skipped. Every mutation requires approval.

**Auth:** API key. Create one in Simplero under Settings > Integrations > "Create new API key". It is sent in the `X-API-Key` header. Simplero's spec also accepts HTTP Basic auth (API key as username, blank password); this package offers only `X-API-Key`.

**Known gaps:** Simplero rejects requests without a `User-Agent` (400 `Incorrect User-Agent`, checked before auth). Every request, including tool calls, is sent with `User-Agent: Executor (support@executor.sh)`. No OAuth is offered by Simplero.
