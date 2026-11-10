# e-conomic

Visma e-conomic accounting. The package mounts thirteen services under one provider: customers, suppliers, products, quoteToCash (quotes, orders, invoices), journals, accounts, bookedEntries, accountingYears, budgets, dimensions, documents, projects and subscriptions (about 380 operations in total). Mutations require approval.

**Interface:** OpenAPI. The documents are the official ones that https://apis.e-conomic.com links from each service's docs page (for example `https://apis.e-conomic.com/customersapi/openapi-Customers.json`). The host serves them only with the public `demo` tokens, so they are embedded unchanged (minified) in `specs/` instead of fetched live. Each service is versioned in its own base path under `https://apis.e-conomic.com/`.

**Auth:** an API key pair, sent as the `X-AppSecretToken` and `X-AgreementGrantToken` headers. The app secret token identifies your integration (from a developer/partner agreement with Visma e-conomic) and the agreement grant token is created by a customer who adds the app in e-conomic under Settings > Integrations > Apps. For testing, e-conomic's own demo agreement accepts `demo` for both tokens on read requests. e-conomic offers no OAuth flow for this API.

**Known gaps:**
- The legacy REST API at `https://restapi.e-conomic.com` (the older invoices, customers, products and similar resources) has no OpenAPI document, only per-resource JSON schemas, so it is not exposed as tools. It is used only for the health check (`GET /self`). The newer services above cover customers, suppliers, products, quotes, orders, invoices and journals.
- The Webhooks service has no document at its documented location and is not included.
- `scripts/tools.ts` reports only the Customers service (22 tools); the others compile the same way at deploy.
