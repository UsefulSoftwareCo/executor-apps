# Payhip

Covers the whole public Payhip API: list, retrieve and create discount coupons, and verify, enable, disable and increase or decrease usage of software license keys (8 tools, grouped as `account.*` and `license.*`).

**Interface:** hand-written tools over the official REST API v2 documented at https://payhip.com/api-reference (base `https://payhip.com/api/v2`). Payhip publishes no OpenAPI document, so the tools are written by hand.

**Auth:** two secrets-backed connections, both created through Executor's secure connection links (no secret is ever a tool argument).
- *Payhip* (`account` tools: coupons): the account API key (`payhip-api-key` header), found in Payhip under Settings > Developer. Health check lists one coupon and decodes `data.coupons`.
- *Payhip product license* (`license` tools): the per-product secret key shown on a product's edit page once license keys are enabled, sent only as the `product-secret-key` header. Connect one account per product; the tool call selects the account. No health check, since Payhip offers no side-effect-free read that does not need a real license key.
Payhip offers no OAuth.

**Interface check:** a follow-up search for an official Payhip MCP server or OpenAPI document was not possible (web search budget exhausted in this run) and the vendor site blocks direct fetches. Payhip's API reference documents 8 endpoints, which this package covers. No official MCP or OpenAPI was found in the reference or in integrations.sh.

**Validation:** createCoupon rejects, before any request, a missing or doubled percentOff/amountOff, percentOff outside (0, 100], non-integer or non-positive amountOff, and a couponType other than single, multi or collection (the schema builders have no min/max or enum).

**Known gaps:** Payhip's API has no products, customers, orders or webhook-management endpoints and no coupon update or delete. Create-coupon does not accept start/end dates or a minimum purchase amount, and does not support recurring subscription products. The docs' decrease-usage example calls `/license/usage`; the tool uses `/license/decrease` as the heading states.
