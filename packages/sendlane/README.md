# Sendlane

Email and SMS marketing for ecommerce with Sendlane's V2 API: contacts (consent, tags, custom fields, history), lists, segments, tags, custom fields, campaigns and reports, SMS messages, senders, email and domain suppression, custom integrations and events, back-in-stock contacts, and ecommerce tracking events (added to cart, checkout started, customer added and more).

**Interface:** OpenAPI. `openapi.json` is Sendlane's official V2 document from its Stoplight docs project, `https://sendlane.stoplight.io/api/v1/projects/sendlane/api-documentation/nodes/sendlane-v2.v2.yaml` (docs: https://sendlane.stoplight.io/docs/api-documentation). The YAML references its schemas in separate files (`models/`, `responses/`); those are inlined unchanged so it compiles as one document. Base URL `https://api.sendlane.com/v2`.

**Auth:** API token only; Sendlane has no user-created OAuth apps. In the Sendlane dashboard open Account > API, click "+ API Token" under Sendlane API V2 and copy the token (it is shown once). It is sent as `Authorization: Bearer <token>`.

**Known gaps:** one operation is skipped because it requires the secondary `Authorization-Destination` header (a second account's token). Every mutation requires approval.
