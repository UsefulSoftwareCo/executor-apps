# JumpCloud

Manage a JumpCloud directory: system users, systems (devices), commands, applications and organizations (API v1), plus user and system groups, policies, directories (LDAP, SCIM, Active Directory), MDM, access requests and integrations (API v2).

Interface: OpenAPI. Both documents are JumpCloud's official specs, mounted under separate keys of one router:

- `v1`: https://docs.jumpcloud.com/api/1.0/index.yaml (served at `/api`)
- `v2`: https://docs.jumpcloud.com/api/2.0/index.yaml (served at `/api/v2`)

Auth: API key. Create an admin API key in the JumpCloud Admin Console (username dropdown, top right, then API Settings; resetting the key there invalidates the old one), then enter the key and your console region (`us`, `eu` or `in`) when connecting. The key is sent as the `x-api-key` header. Every mutation requires approval.

Known gaps:

- No OAuth: JumpCloud's OAuth is for SSO apps, not for calling the management API.
- The Directory Insights API (`api.jumpcloud.com/insights/directory/v1`) has no published OpenAPI document and is not included.
- Multi-tenant (MSP) calls that need the `x-org-id` header are not exposed as a connection setting.
- The health check calls `GET /api/organizations`.
