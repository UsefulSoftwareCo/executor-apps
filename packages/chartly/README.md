# Chartly

Render Chart.js configurations as PNG or SVG images (GET or POST), create
permanent shareable chart URLs, fetch a stored chart, use the no-key open chart
endpoint, and check service status.

**Interface:** Chartly's official OpenAPI 3.1 document at
https://api.chartly.dev/openapi.json (linked from https://docs.chartly.dev/api/),
6 tools. The document also lists signup, Stripe webhook, Google OAuth and
Zapier-only routes; `openapi.ts` removes them. Creating a permanent chart is a
mutation and asks for approval.

**Auth:** API key. Create one in the Chartly dashboard (https://chartly.dev/dashboard);
a free trial key can be generated at https://chartly.dev. It is sent in the
`X-Api-Key` header. Chartly has no user-created OAuth apps. The connection check
renders a 1x1 chart, which counts as one render against the plan.

**Known gaps:** image renders return binary data, so they are most useful through
the permanent URL from `chart/create`. Permanent charts cannot be deleted
(Chartly has no delete endpoint). The per-chart metrics endpoint
(`GET /v1/metrics/{id}`) and signed URLs are documented but not in the OpenAPI
document, so they are not tools.
