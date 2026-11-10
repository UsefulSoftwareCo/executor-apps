# Debitura

Debitura is an API-first international debt collection platform. This package covers two of its APIs, mounted as `customer` and `collectionPartner` in one router, each with its own account type and key.

- Customer API (creditors): cases (create, preview, timeline, chats, files, payments, quotes), coverage and eligibility, divisions, payments, tasks, users and webhooks. Interface: OpenAPI, https://docs.debitura.com/openapi/customer-api.json (base URL https://customer-api.debitura.com). 49 tools.
- Collection Partner API (collection partners): cases, managed cases and related resources. Interface: OpenAPI, https://docs.debitura.com/openapi/collection-partner-api.json (base URL https://collectionpartner-api.debitura.com). 56 tools.
- Auth: API key for each, sent in the `XApiKey` header. Create the Customer key in the Debitura creditor portal at https://app.debitura.com/CreditorApiKey and the Collection Partner key in the Partner Portal at https://partner.debitura.com/CollectionPartnerApiKey/Index. The two keys are not interchangeable; connect whichever applies.
- Mutations require approval. The Customer spec also includes `/test/...` sandbox endpoints (Debitura has no separate test environment; use the `IsTest` flag in production).
- The Customer spec lists four colon-style duplicates of slash operations (`GET /coverage/:search`, `POST /divisions/{id}:archive`, `/webhooks/{id}:test`, `/webhooks/{id}:replay`). They are removed so each operation appears once, under its slash path.

Known gaps: the Referral Partner API has no public OpenAPI document (it uses an API key in `XApiKey`, issued via partnerships@debitura.com) and is not included. The Customer API's JWT Bearer scheme (`POST /oauth/token`, used by referral partners) is not offered. The icon is Debitura's brand mark taken from its site favicon asset (256px PNG); the vendor publishes no SVG mark.
