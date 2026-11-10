# Enginemailer

Manage Enginemailer email marketing: find, add, update, delete, tag and unsubscribe subscribers, poll subscriber changes and autoresponder events, list forms, pages, popups, campaigns, templates, domains and subcategories, and send transactional email.

## Interface

Hand-written tools over Enginemailer's official integration API at `https://connect.enginemailer.com/api/N8N/v1`. Its official Swagger document (`https://connect.enginemailer.com/swagger/N8Nv1/swagger.json`) lists 24 operations (23 tools plus the `connect` health check) but declares no request bodies for the POST endpoints, so the tools are written by hand; the body fields come from Enginemailer's official n8n node (`Enginemailer-Official/n8n-nodes-enginemailer`).

## Auth

API key. Generate it in your Enginemailer account under API Keys, as described in the vendor's help article (`https://enginemailer.zendesk.com/hc/en-us/articles/360057634711-Manage-API-keys-for-your-account`) and the official n8n node README. It is sent in the `APIKEY` header to `connect.enginemailer.com`. The account health check calls the `connect` endpoint.

## Known gaps

- Enginemailer's separate REST API (campaign create/send/schedule, category management, transactional v2, CSV report export on `api.enginemailer.com/restapi`) uses a different host and has no published OpenAPI document, so it is not covered.
- POST body field types (for example `subcategories`, `customfields`) are passed as strings; formats are not documented in the Swagger file.
- The `type` values of `emails.send` (Template/HTML) are inferred; the vendor's n8n node only exposes the field as `contentType`. Bodies for deletesubscriber, unsubscribe, tagtosubcategory, untagtosubcategory and findsubscriber were not confirmed against vendor code. The REST API gap is unverified, not confirmed absent.
