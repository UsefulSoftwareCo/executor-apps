# Adtraction

Adtraction is a Nordic and European affiliate network. This package covers both sides of the API: partner (publisher) tools for programs, markets, categories, commission types, coupons and offers, tracking links, product search and feeds, clicks, transactions, claims, statistics, commission summaries, balance, payments and tracking errors; and advertiser tools for channel approval, clicks, transactions (including approving or rejecting pending ones), segments, coupons and statistics. 45 tools in two groups, `partner` and `advertiser`.

**Interface:** hand-written tools over Adtraction's official REST API. Adtraction publishes no OpenAPI document; the documentation at https://api.adtraction.net/ (v3, which also lists the v2 endpoints) is the source. Where v3 has an endpoint (programs, commission types, product feed, product feed info, client channels) the v3 path is used; the remaining endpoints use v2, which the docs still list as current. POST endpoints that only filter and report (statistics, clicks, transactions, product search) are queries; writes (create claim, update channel status, update transaction, add coupon) and tracking link creation require approval.

**Auth:** API token. Create it in your Adtraction account under Account > Settings and paste it into the connect page. It is sent in the `X-Token` header to `api.adtraction.net`. Partner and advertiser accounts have separate tokens, so only the matching group works for a given token. Adtraction has no OAuth.

**Notes and gaps:**
- The "Public" endpoints (including `/public/products/`; partner product search is covered by `searchProducts` at `/v2/partner/products/`, plus loan and telecom comparison and exclusive coupon code) are not included because they are aimed at public comparison feeds rather than account data. The PDF/CSV downloads (payment specification, gclid report) are not included because they return non-JSON.
- Rate limits are per minute; a 429 reports the time until reset.
- The icon is the Adtraction mark redrawn as SVG from the logo on adtraction.com, because Adtraction publishes no downloadable SVG.
