# Payhere

Payhere payment links and subscriptions: list and fetch customers, payments and subscriptions, list, create and update plans, cancel subscriptions, read and update the company, read 30-day payment stats, read the user for the API key, and issue full or partial refunds (15 tools).

**Interface:** hand-written tools over the Payhere REST API (`https://api.payhere.co/api/v1`), covering every endpoint in the developer docs (https://developers.payhere.co/docs/api-auth). No OpenAPI document or MCP server was found in the docs or the integrations.sh record, so none is used. List tools take optional `page` and `perPage` (max 100). Every mutation (`refunds.create`, `plans.create`, `plans.update`, `subscriptions.cancel`, `company.update`) requires approval. `subscriptions.cancel` calls `DELETE /subscriptions/:id`; the docs say it cancels immediately so there are no further payments while the subscription remains active until period end. The refund `reason` is restricted to `requested_by_customer`, `duplicate` or `fraudulent`.

**Auth:** API key sent as `Authorization: Bearer <key>`. Find it under Integrations in the Payhere merchant admin (https://app.payhere.co). Payhere offers no user-created OAuth apps. The docs also accept an `access_token` query parameter for quick testing; it is not offered. The health check reads `/user` and requires `{ data: { id } }`.

**Known gaps:**
- Plan creation does not support digital-download file uploads (multipart `download_file`) and company update does not support the `logo` upload; `download_type`/`download_url` and custom fields are not exposed.
- Webhooks and REST Hooks are not covered.
- Icon is the official Payhere stamp SVG from developers.payhere.co.
