# Pipeline CRM

Deals, people, companies, activities, tasks, projects, files and custom fields in Pipeline CRM, through its REST API v3.

**Interface:** OpenAPI. Pipeline CRM publishes its own document at https://app.pipelinecrm.com/openapi.json (API origin `https://api.pipelinecrm.com/api/v3`). Tools are generated live from it.

**Auth**
- API token (recommended): create one from your profile under "API tokens" in Pipeline CRM and paste it. Sent as `Authorization: Bearer`.
- Legacy API key and app key: for existing integrations. The user's `api_key` (Settings, API, API Keys) is sent as the bearer credential and the integration's `app_key` (Settings, API, API Integrations) as the `app-key` header, as the spec allows instead of URL query parameters.
- OAuth is not offered; Pipeline CRM has no user-created OAuth apps. JWT login (email and password, with MFA) is not offered.

**Approvals:** every mutation requires approval.

**Icon:** Pipeline CRM's 300px site icon (pipelinecrm.com); the vendor publishes no SVG of the mark alone.

**Known gaps:** none known; the health check calls `GET /users?per_page=1`.
