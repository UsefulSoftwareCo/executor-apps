# Bookingmood

Bookingmood is booking software for vacation-rental businesses. This package exposes its REST API: list, create, update and delete for products, bookings, contacts, payments, invoices, price calendars, seasons, coupons, services, messages, tasks, sites, reviews and webhooks, plus availability, availability search, `book`, `cart-validate` and `cart-checkout`.

## Interface

Hand-written tools over the official API at `https://api.bookingmood.com/v1` (reference: https://www.bookingmood.com/en-US/api-reference). The API is PostgREST, so list, update and delete take PostgREST `filters` (`{ status: "eq.CONFIRMED" }`), `select`, `order`, `limit` and `offset`. Bookingmood does not publish an OpenAPI document: PostgREST's generated one is served at `/v1/openapi.json` only to authenticated requests, so it cannot be compiled ahead of time. Tools are generated from the documented endpoints of each resource (215 tools); update and delete refuse to run without a filter, and every mutation (including `book` and `cartCheckout`) requires approval.

## Auth

API key. Create one at the bottom of your organization's settings page in the Bookingmood admin dashboard. It is sent as `Authorization: Bearer <key>` and is scoped to that organization. The API reference documents only API keys.

## Known gaps

- `availability` passes `product_ids` as `in.(id,id)`, following how the Bookingmood client libraries call it; the reference's curl example uses a single `product_id`.
- Not tested against a live account (no credentials were used).
- Column schemas are not in the tool inputs; request bodies are free-form JSON as documented in the API reference.

## Availability

The vendor's `/availability` page lists `product_ids` (Array<uuid>) but its only curl example uses `product_id`. The tool accepts both: `product_id` (single uuid) and `product_ids` (sent as repeated `product_ids=<uuid>` keys). Ids are validated as uuids. Neither form has been confirmed against a live account.
