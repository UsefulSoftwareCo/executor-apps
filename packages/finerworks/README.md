# FinerWorks

Print-on-demand and custom framing fulfillment from FinerWorks: orders, products and pricing, framing (frames, mats, glazing), shipping options, the image library, GeoGalleries, virtual inventory, and account and billing endpoints. 61 tools.

## Interface

Hand-written tools over FinerWorks' v3 REST API (`https://api.finerworks.com/v3/...`). FinerWorks publishes no OpenAPI document, only an ASP.NET help page, so the endpoint list comes from the official reference at https://api.finerworks.com/Help. Tools are grouped as orders, customers, images, framing, products, inventory, shipping, account and activity.

GET tools take their query parameters directly. POST, PUT and DELETE tools take the endpoint's JSON as `body`; each tool description carries an example body from the reference. Every mutation (and the POST endpoints that write) requires approval.

## Auth

API credentials only; FinerWorks has no OAuth. Sign in to your FinerWorks account and open https://account.finerworks.com/web-api-key (per the vendor's Documentation page) to copy your `web_api_key` and `app_key`. An app_key starts in test mode; switch it to live mode from that page before real orders are processed.

## Known gaps

- Request bodies are free-form JSON objects, not typed schemas; follow the examples in each description and the vendor reference.
- Event log, credit and promo endpoints need special permission on the FinerWorks account.

- Hosts: requests go to `api.finerworks.com`; the vendor's samples also use `v2.api.finerworks.com`, which is declared as an allowed host too.
- The credential check (`test_my_credentials`) sends the keys as headers only; the vendor page also shows them in a GET body, which is not sent. Live check not yet run.
