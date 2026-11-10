# StoreCensus

Looks up e-commerce intelligence on Shopify and WooCommerce stores: single-store profiles by domain or lead id, filtered store lists (100+ filters, selection logic, timing filters, cursor pagination), the Shopify app directory and its categories, and contact enrichment (emails, phones, decision makers) for lead ids.

**Interface:** custom tools written with `fetch` against the official REST API v1 at `https://www.storecensus.com/api/v1`, documented at https://www.storecensus.com/api. StoreCensus publishes no OpenAPI document, so the five documented endpoints are hand-written: `getWebsite`, `searchStores`, `listApps`, `listAppCategories` and `enrichLeads`. `enrichLeads` spends credits and always requires approval.

**Auth:** API key, sent as `Authorization: Bearer <key>`. Generate it on the API page of your StoreCensus account (https://www.storecensus.com/user/api); an active subscription is required. StoreCensus has no OAuth. Rate limits are 6 requests/second (Professional) and 30 (Enterprise), with a `Retry-After` header on 429.

**Known gaps:** the `filters` object for `searchStores` is passed through as JSON rather than modelled field by field, since the vendor lists over 100 filters; see the vendor docs for names. Response shapes are not schema-checked. The health check calls the app directory with `pageSize=1` (read-only), which needs an active subscription.
