# Beaconstac (Uniqode)

Beaconstac is now Uniqode. This package manages dynamic QR codes and templates, bulk QR collections, digital business cards and wallet passes, leads, forms and responses, places, tags, media, webhooks, organizations, users, and and period/product overview analytics (62 tools).

Interface: hand-written tools over the REST API at `https://api.uniqode.com/api/2.0/`. Uniqode publishes no OpenAPI document, only an official Postman collection and docs at https://apidocs.uniqode.com/; the tool list follows that collection. Request and response bodies are passed as JSON (`body`, `query`) without typed schemas, so see the docs for campaign fields per `content_type`. The two analytics tools are read-only POSTs to `/reporting/2.0/` (`method=Products.getPeriodOverview` and `Products.getOverview`) and run without approval; all other writes need approval. Every tool accepts an optional `query` object (numbers and booleans are stringified), needed for example for the required `organization` parameter on cards.

Auth: API key. In the Uniqode dashboard open "API" in the sidebar and copy the key; it is sent as `Authorization: Token <key>` to `api.uniqode.com`. The vendor offers no OAuth.

Known gaps: multipart/CSV endpoints (bulk QR/card CSV validation and creation, bulk card deletion and image downloads, media binary upload), the CSV analytics export (`/reporting/2.0/`), and delete-template-by-body are not exposed. The QR code image download is not exposed because it returns a binary file. The reporting paths could not be checked against the Postman collection (it could not be fetched here); the per-metric `/api/2.0/organizations/{id}/products/...` analytics endpoints previously included could not be verified and were removed.
