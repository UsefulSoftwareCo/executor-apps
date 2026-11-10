# Tapfiliate

Affiliate and referral tracking with Tapfiliate: programs, affiliates and groups, prospects, customers, conversions, commissions, payments, balances and clicks.

**Interface.** Hand-written tools over the REST API v1.6 (`https://api.tapfiliate.com/1.6/`), documented at https://tapfiliate.com/docs/rest/. Tapfiliate publishes no OpenAPI document and the REST docs mention no MCP server (a further web search for an official MCP server could not be run because the search budget was exhausted); the only specs found are community-generated and were not used. Reads are queries; every write (create, update, delete, approve, pay) is a mutation that asks for approval. Paginated lists take `page` and return `{ data, nextPage }` when more pages exist.

**Auth.** API key. Find and manage it in your Tapfiliate account settings, as described in the vendor docs and support article 1441950-your-api-key (support.tapfiliate.com); the exact menu path is not documented, so no deep link is given. It is sent as the `X-Api-Key` header to `api.tapfiliate.com`. There is no OAuth for customer accounts.

**Gaps.** Request bodies for create/update calls are passed through as JSON objects, as documented by Tapfiliate; the tool descriptions list the fields. Clicks list and retrieve require the Tapfiliate Enterprise plan. Tools were typechecked and deployed but not run against a live account.
