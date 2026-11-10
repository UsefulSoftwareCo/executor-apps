# Booqable

Booqable rental software: orders, customers, products, product groups, bundles, stock items, availability, inventory levels, pricing (price rules, structures, tiles), payments, documents, emails, locations, taxes, users and webhooks. 209 tools.

## Interface

Hand-written tools over Booqable's REST API v4 (JSON:API) at `https://<company>.booqable.com/api/4`, taken from the official reference at https://developers.booqable.com/. Booqable publishes no OpenAPI or Swagger document, so the tool list mirrors the documented endpoints. Each GET tool takes `filter`, `include`, `sort`, `fields`, `page_number`, `page_size` and a `params` escape hatch; each write tool takes the JSON:API document as `body`. Every POST, PUT and DELETE asks for approval.

## Auth

- Access token: sign in to your Booqable account, open `<company>.booqable.com/employees/current`, name a token and click "Create new authentication method". Enter the token and your company slug (the `<company>` in `<company>.booqable.com`). It is sent as `Authorization: Bearer <token>`.

Booqable documents no user-created OAuth apps, and request signing (single-use JWTs) is not supported here.

## Known gaps

- The reference is in beta and some endpoints share one URL with several variants (availabilities, order fulfillments, stock adjustments, users enable/disable); these are one tool each, and the variant is chosen by the parameters or body, as described in the reference.
- Request and response shapes are not validated beyond JSON; consult the reference for each resource's attributes.
