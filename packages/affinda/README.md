# Affinda

Affinda document AI: upload and parse resumes, invoices, receipts and custom documents; manage workspaces, collections, document types, data points, annotations, search and matching, organizations, API users and webhooks. 143 tools (86 mutations, all approval-gated).

**Interface:** OpenAPI, Affinda's official v3 document at https://api.affinda.com/static/v3/api_spec.yaml, fetched live.

**Auth:** API key only. Create one in the Settings page of the Affinda web app (https://app.affinda.com). Enter the key and the account region: `api` (Australia/Global), `api.us1` (US) or `api.eu1` (EU); the region is the subdomain in your Affinda web app URL. Affinda offers no user-created OAuth apps for the API, so OAuth is not offered.

**Icon:** the Affinda mark taken from the vendor's website logo (wordmark letters removed).

**Gaps:** none known in the spec; file upload endpoints that take multipart bodies depend on the OpenAPI runtime's multipart support.
