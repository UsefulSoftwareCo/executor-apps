# ActiveTrail

Email, SMS, WhatsApp and push marketing with ActiveTrail: contacts, groups, mailing lists, campaigns and campaign reports, automations, templates, segmentation, sign-up forms, webhooks, commerce and sales-lifecycle objects, operational messages and external-contact sync. 232 tools, grouped by API area (`contacts`, `campaigns`, `groups`, `automations`, ...).

**Interface:** hand-written tools over ActiveTrail's official REST API at `https://webapi.mymarketing.co.il`. ActiveTrail publishes no OpenAPI or Swagger document (only an HTML reference at https://webapi.mymarketing.co.il/api/docs/ and a partial Postman collection) and no MCP server. `routes.ts` is a table of every endpoint listed in that reference (method, path, path and query parameters, description, docs page), and `index.ts` turns each row into one tool. Request bodies are passed as a `body` JSON object; each tool description links to the endpoint's docs page for the payload fields. Responses are returned as the API sends them.

**Auth:** API token only; ActiveTrail has no OAuth. Create one in ActiveTrail under More > Integrations > API > Apps (https://www.activetrail.com/integrations/learning/guides/a-guide-to-accessing-activetrails-restful-api/). Tokens can be limited to IP addresses and given an expiry. The token is sent raw (no `Bearer` prefix) in the `Authorization` header to `webapi.mymarketing.co.il`. The health check reads `/api/account/balance`.

**Notes and gaps:** every non-GET tool asks for approval. Input schemas for request bodies are not typed because the reference documents them only as HTML pages. Responses are not schema-checked. The reference lists a few legacy/duplicate WhatsApp content endpoints, kept as separate tools.
