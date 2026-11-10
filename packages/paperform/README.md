# Paperform

Covers Paperform's REST API: forms and fields, submissions and partial submissions, products, coupons, form webhooks, spaces, translations, file URLs, and Papersign documents, folders and webhooks.

Interface: OpenAPI. The document is Paperform's own, published on its ReadMe developer hub (https://paperform.readme.io) and fetched from `https://dash.readme.com/api/v1/api-registry/pju693bmv4i6h2u`. The API base is `https://api.paperform.co/v1`.

Auth: API key only (Paperform's API has no OAuth). Create a key under Account > Developer in Paperform (https://paperform.co/help/articles/developer-plan/). It is sent as a Bearer token. Some endpoints (spaces, webhooks, translations, Papersign) require a Business-tier API plan.

Gaps: the OpenAPI document sits on a ReadMe URL, not a Paperform domain, so it could move if Paperform changes its docs host. Mutations require approval.
