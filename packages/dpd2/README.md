# DPD

Covers DPD (Digital Product Delivery, getdpd.com, Portal Labs LLC), the platform for selling ebooks, software and other digital goods: storefronts, products, purchases (including reactivation), customers and subscription subscribers.

Interface: hand-written tools over the official REST API v2, `https://api.getdpd.com/v2`, documented at https://getdpd.com/docs/api/about.html. DPD publishes no OpenAPI document. The About page says the API is read-only, but that page is stale: the purchases page (https://getdpd.com/docs/api/purchases.html) documents `POST /purchases/:id/reactivate`, which is the one write tool exposed (approval required). The API works on hosted `*.dpdcart.com` stores only.

Auth: one method, HTTP Basic with your DPD account username and the API password shown on your DPD profile page. No OAuth is offered.

Credentials may contain any characters (they are UTF-8 encoded before Base64).

Unverified assumptions: the purchases page does not say how `reactivate` parameters are encoded or which value `refulfill` takes; the tool sends `application/x-www-form-urlencoded` with `refulfill=true`. This was not tested against a live account. On `subscribers/verify` the vendor's parameter table says `id` while its prose says `subscriber_id`; the tool exposes both inputs and sends whichever is set (`username` is unambiguous and shown in the vendor's example). `GET /storefronts` documents no paging, so `listStorefronts` takes no `page`.

Known gaps: the `notification/verify` endpoint (for verifying URL-integration POSTs to your own server) is not exposed. Collections return 100 records per page; use `page`.
