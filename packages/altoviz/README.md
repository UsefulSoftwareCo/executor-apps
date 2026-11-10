# Altoviz

Billing and invoicing with Altoviz: customers, suppliers, contacts, products, invoices, quotes, credit notes, receipts, bank accounts and statistics.

**Interface:** OpenAPI, from Altoviz's official document at https://api.altoviz.com/openapi.yaml (all operations on `https://api.altoviz.com`). Mutations require approval.

**Auth:** API key only. Altoviz sends it in the `X-API-KEY` header. Create one in the Altoviz app under Settings > API access (https://app.altoviz.com/go/settings/apis). Altoviz does not offer user-created OAuth apps, so there is no OAuth method.

**Icon:** Altoviz's own mark, taken from the favicon served by https://api.altoviz.com/favicon.svg.

**Known gaps:** 29 operations (the `/v1/SaleCredits*` and `/v1/SaleInvoices*` routes) are marked deprecated in the spec in favour of the `Sales*` spellings; they are kept because they still work. The spec declares no security on its operations, so the package patches the document's global security to require the `ApiKey` scheme, which makes every call carry `X-API-KEY`. Rate limits are not documented in the spec and are not described here.
