# Best Buy

Search Best Buy products, stores and categories, read trending and related-product recommendations, product warranties, in-store availability and open-box offers.

**Interface:** hand-written tools over the Best Buy Developer API (`https://api.bestbuy.com`), documented at https://bestbuyapis.github.io/api-documentation/. Best Buy publishes no OpenAPI document, so 14 read-only tools cover the documented Products, Stores, Categories, Recommendations and Buying Options (open box, `/beta`) endpoints.

**Auth:** API key. Create one at https://developer.bestbuy.com/ and paste it in as the account's API key. It is sent as the `apiKey` query parameter, which is how the API takes it. There is no OAuth.

**Known gaps:** all tools are read-only. The Commerce API (carts, orders) needs a separate key available by invitation and is not included. Responses are requested as JSON. The vendor docs publish no numeric rate limits (a 403 means an invalid key or an exceeded allocated call limit, and the docs warn of Query Per Second errors); the package does no client-side throttling, so callers can hit QPS errors. Batch SKU lookups with the `in` operator (for example `sku in(1,2,3)`) as the docs advise. Caller-supplied filters, SKUs and category IDs are percent-encoded where they would otherwise break the URL (`#`, `?`, `%`).

**Icon:** the Best Buy logo from Wikimedia Commons (https://commons.wikimedia.org/wiki/Special:FilePath/Best_Buy_logo_2018.svg); Simple Icons lacks it and no official SVG was found on Best Buy's press pages.
