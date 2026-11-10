# Billsby

Manage Billsby subscription billing: customers, subscriptions, invoices, credit notes, products, plans, add-ons, allowances and custom fields (50 tools; 4 operations are skipped for unresolved schema references).

**Interface:** OpenAPI. Billsby publishes its swagger document at https://api.billsby.com/swagger/v1/swagger.json. It describes the internal backend routes (`/public/api/v1/{companyDomain}/...` plus many `/api/...` dashboard routes) and declares no servers or security. `spec.json` is the public slice of that document, with paths moved to the documented public gateway prefix `https://public.billsby.com/api/v1/rest/core/{companyDomain}/...` (https://support.billsby.com/reference/using-the-api) and the `apikey` header scheme added. The dashboard-only routes are left out. The `/public/api/v1/invoices/{invoiceNumber}` route has no company domain and is omitted.

**Auth:** API key. In Billsby go to Settings > Configuration > API keys and webhooks, create a key, and enter it with your company domain (the `<company>` part of your Billsby account URL). The key is sent in the `apikey` header; the company domain is filled into every call. Billsby offers no OAuth for third-party apps.

**Approvals:** every non-GET operation (create, update, delete, refunds, payments) asks for approval, plus the GET `customers.getRestCorePaymentdetailsrequest`, which emails the customer a payment-details change request and is therefore treated as a mutation.

**Unverified:** Billsby's public API reference (support.billsby.com/reference/using-the-api) returns HTTP 401/redirects to anonymous clients, so the `apikey` header name, the `public.billsby.com/api/v1/rest/core/{companyDomain}` gateway and the company-domain placement could not be confirmed against vendor text. They are the package's best inference; the gateway host answers 403 (not 404) on that prefix unauthenticated. integrations.sh has no Billsby record. No source confirms or denies OAuth for third-party apps.

**Known gaps:** the path rewrite comes from the swagger and Billsby's reference pages, not from a vendor-published public-gateway spec; if an operation 404s, it may not exist on the public gateway. Webhooks are not covered.
