# Finmei

Covers Finmei's public API: the business profile, invoices (list, get, create, update, delete, PDF download) and expenses (list, get, create with bill file, update, replace file, download file). 13 tools.

**Interface.** Hand-written tools over the REST API at `https://app.finmei.com/api`. Finmei publishes no OpenAPI document, only the Postman reference at https://documenter.getpostman.com/view/835227/2s9YXh5NRs, which these tools follow. Mutations require approval.

**Auth.** API token only (Finmei has no OAuth). Generate it at https://app.finmei.com under Settings -> Integrations; it is shown once and is scoped to a single business. API access needs Finmei's PRO plan or higher.

**Gaps.** The public reference documents only profile, invoices and expenses. Customers, products, payments and currencies endpoints are not in Finmei's documentation, so they are not included. File uploads take base64 content; downloads return `{ contentType, base64 }`. **Unverified.** Only the base URL, Bearer auth, GET /profile and POST /invoices (fields and invoice types) were confirmed against outside sources. The other paths (expenses, invoice get/update/delete/download, paging parameter) follow Finmei's Postman reference but could not be cross-checked, so treat them as best effort. No rate limit is documented.
