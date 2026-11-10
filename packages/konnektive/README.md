# Konnektive

Konnektive CRM for direct-response e-commerce: leads, orders, upsales, customers, transactions, purchases (subscriptions), club members, products, campaigns, gateways and cascades, coupons, affiliates and reports. 90 tools, one per documented endpoint.

## Interface

Hand-written tools, generated from the vendor's public Postman documentation at <https://apidocs.konnektive.com/> (Konnektive publishes no OpenAPI document and no MCP server). Every endpoint is `POST https://api.konnektive.com/<path>/`; `endpoints.ts` holds the path, field list and read/write kind for each. Each tool takes `{ params: { ... } }`; the tool description lists the fields, with `*` marking required ones. Credentials are added for you and sent in the form body, not the URL. Queries run without approval; every tool that creates, updates, refunds, cancels or deletes requires approval.

## Authentication

API user (`loginId` and `password`). In Konnektive CRM an admin opens Admin > Users, adds a user with the "Api User" access level, and picks the endpoints it may call. The password cannot contain `&`. Konnektive also requires the calling server's IP address to be whitelisted for the API user. Konnektive has no OAuth for the CRM API.

## Known gaps

- Capture Transaction is omitted: the documentation gives no endpoint path for it.
- Responses are returned as Konnektive's JSON (`result` of `SUCCESS` or `ERROR` with a `message`); API errors arrive with HTTP 200.
- Input is not schema-typed per field; Konnektive validates the values.
