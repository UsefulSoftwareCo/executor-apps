# Maxio

Maxio Advanced Billing (formerly Chargify): customers, subscriptions, products, components, invoices, coupons, payments and reporting. 283 tools.

**Interface:** OpenAPI 3.0, the official export published on the Maxio developer portal, <https://developers.maxio.com/static/exports/maxio-advanced-billing-openapi3json.json>. Every mutation requires approval.

**Auth:** API key. Create one in Advanced Billing under Config > Integrations > API Keys (a per-site key). Enter the site subdomain (`acme`, or the full host `acme.chargify.com` / `acme.ebilling.maxio.com` for EU-hosted sites) and the key. The key is sent as the HTTP basic-auth username with the password `x`. Maxio offers no user-created OAuth apps, so there is no OAuth method.

**Known gaps:** the two event-ingestion endpoints (`POST /events/{api_handle}.json` and `/bulk.json`) are served from a separate `events.chargify.com/{site}` host and are not mounted. Maxio's other products (e.g. Maxio Billing portal, Maxio.js) are not covered.
