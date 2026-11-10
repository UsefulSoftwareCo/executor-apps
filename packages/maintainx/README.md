# MaintainX

Covers the MaintainX REST API v1: work orders, work requests, assets, parts and inventory, purchase orders, meters and readings, maintenance plans, procedure templates, locations, categories, teams, users, vendors, customers and more.

Interface: OpenAPI, loaded live from MaintainX's official document at https://api.getmaintainx.com/v1/openapi.json (human docs: https://api.getmaintainx.com/v1/docs). Every mutation requires approval.

Auth: API key (bearer token). Create it in MaintainX under Settings > Integrations > API Keys (https://app.getmaintainx.com/settings/integrations/apiKeys). The vendor's authentication docs describe only API keys (bearer tokens), so OAuth is not offered. API access is available on MaintainX Premium and Enterprise plans. Multi-organization tokens must pass the organization ID as the `x-organization-id` input on each call.

Known gaps: webhooks are configured in the MaintainX UI and are not exposed as tools. The OpenAPI document exposes only `x-organization-id`; the vendor's `x-organization-ids` header (comma-separated, for some list endpoints, and not combinable with `x-organization-id`) is not supported.
