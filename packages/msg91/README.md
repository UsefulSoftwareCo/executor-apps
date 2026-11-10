# MSG91

Send SMS, OTP, email, WhatsApp and voice messages through MSG91, validate email addresses, read delivery logs and analytics, upsert Segmento contacts and launch campaigns (20 tools).

**Interface:** hand-written tools over MSG91's v5 REST API at `https://control.msg91.com/api/v5`, following the endpoints in the official docs at https://docs.msg91.com. MSG91 publishes no OpenAPI document or MCP server, so the tools are written by hand and cover the main documented endpoints.

**Auth:** an Authkey, sent in the `authkey` header. Create or copy it in the MSG91 dashboard under your profile menu, Authkey. MSG91 offers no OAuth for customer apps. The health check calls the SMS analytics report for today's date.

**Known gaps:** WhatsApp group, catalog, interactive-message and payment endpoints, RCS, Hello (ticketing), OTP widget, sub-account and template-authoring endpoints are not exposed. Request bodies for logs, voice logs and email/WhatsApp sends are passed as JSON where the docs define nested structures; check the docs for field details. No call was made with real credentials, so request shapes come from the docs only.
