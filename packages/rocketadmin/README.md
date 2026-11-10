# Rocketadmin

Rocketadmin is an open-source admin panel for SQL and MongoDB databases. This package exposes the whole Rocketadmin API: connections, tables and rows, groups and permissions, dashboards, saved queries, table settings, filters, logs, secrets and AI helpers (204 tools, mutations require approval).

**Interface:** OpenAPI, the official description served by Rocketadmin at https://app.rocketadmin.com/api/docs-json (Swagger UI at https://app.rocketadmin.com/api/docs). The description lists no `servers`, so the package sets the base URL to `https://app.rocketadmin.com/api`.

**Auth:** API key, sent in the `x-api-key` header. Create it in the Rocketadmin dashboard (https://app.rocketadmin.com) from your account's API keys. Rocketadmin has no user-created OAuth apps. The health check calls `GET /check/apikey`.

**Known gaps:**
- Header mapping: the spec declares an `apiKey` scheme `api_key` in header `x-api-key`, but 211 operations reference an undeclared `bearer` scheme. The server reads the key from `x-api-key` (checked without credentials: a dummy key in `x-api-key` on `GET /api/check/apikey` gets a 404 "No authorization keys found", while the same key as `Authorization: Bearer` gets a 401 without a key lookup). Sending `x-api-key` on the other `bearer` operations is an assumption based on the spec's declared scheme; Rocketadmin's docs name no header.
- Filtered out (32 operations, so 204 tools instead of 236): the 25 operations with no security requirement (`GET /hello`, `/internal/agents/*`, `/internal/sitenova/*`, and the site end-user `/sitenova/{connectionId}/auth/*` and `/data/*` endpoints) and the session-only `POST /user/login`, `POST /user/otp/login`, `POST /saas/user/login`, `POST /saas/user/google/login`, `POST /saas/user/github/login`, `POST /saas/user/otp/login` and `PUT /company/2fa/{companyId}`. Other `/saas/*` and `/user/*` endpoints remain; they were not tested and may reject an API key.
- Approvals: the framework treats only GET as a query, so POST operations that only read data (such as row search and CSV export) also require approval.
- Plan gating: many row and table endpoints are labeled "API+" in the spec; they may need an API+ plan and return an error on other plans.
- Self-hosted Rocketadmin instances are not supported; the host is fixed to app.rocketadmin.com.
