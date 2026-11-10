# PostGrid

Direct mail and address verification: letters, postcards, cheques, self mailers, boxes, templates, contacts, bank accounts, mailing lists, campaigns, webhooks and sub-organizations (Print & Mail API), plus standard and international address verification, autocomplete, batch verification and lists (Address Verification API).

## Interface

OpenAPI, from PostGrid's official document at `https://guides.postgrid.com/api/openapi.yaml`, which covers both products on `https://api.postgrid.com`. All 142 operations compile (79 mutations, each requiring approval), none skipped.

## Auth

API key, sent in the `X-API-Key` header with no prefix; the same header is used for both the Print & Mail and Address Verification endpoints. Each organization user gets a test key and a live key, found on the Settings page of the PostGrid dashboard. Test keys run in an isolated sandbox and do not send real mail; live keys do and need a payment method on the account. The vendor documents only API keys and no OAuth flow, so apiKey is the only auth method.

## Known gaps

Multipart/PDF upload variants are limited to what the OpenAPI compiler supports.
