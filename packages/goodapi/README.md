# GoodAPI

Plant trees, rescue plastic bottles and donate to charities through GoodAPI's standalone API: plantings and refunds, planting evidence, tree projects, charity search and donations, and the organization's impact dashboard URL.

**Interface:** OpenAPI 3.1, the vendor's official document at https://app.thegoodapi.com/openapi.json (docs: https://www.thegoodapi.com/docs/api/). Tools are generated live from it; every mutation requires approval.

**Auth:** API key. The key goes raw in the `Authorization` header (no `Bearer` prefix). Each account has a production key (real impact, billed monthly) and a test key (no charges); sign in at https://app.thegoodapi.com/fe/login to view or rotate them. Use the test key unless you intend real plantings. The vendor offers no OAuth.

**Known gaps:** only the standalone API is covered. The separate Shopify API (`sprout-app.thegoodapi.com`, `api_key` plus `shop_name` headers) is not included.
