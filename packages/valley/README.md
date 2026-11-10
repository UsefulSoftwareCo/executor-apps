# Valley

Valley is a LinkedIn and email outreach platform. This package covers its public API: campaigns and prospects, inbox conversations, message and response approvals, the warmlist (engagers, followers, viewers, monitored profiles), templates, writing styles, workspace products and rules, webhooks, do-not-contact lists and analytics.

Interface: OpenAPI, from Valley's official Public API document at https://api.joinvalley.co/docs/json (Swagger UI at https://api.joinvalley.co/docs). Mutations require approval.

Auth: API key only. Valley offers no user-created OAuth apps. Generate the key in the Valley app (https://app.joinvalley.co) under Settings, Integrations, Valley API Key. It is sent in the `x-api-key` header to api.joinvalley.co. The health check calls `GET /public/v1/users/me`.

Icon: the app icon Valley publishes as its site icon (https://www.joinvalley.co); Valley offers no SVG.

Known gaps: none known.
