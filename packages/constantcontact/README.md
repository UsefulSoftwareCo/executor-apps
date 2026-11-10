# Constant Contact

Contacts, contact lists, tags, custom fields, segments, email campaigns and A/B tests, campaign and contact reports, bulk activities, automations and account services in Constant Contact (V3 API).

## Interface

OpenAPI. The tools are generated from Constant Contact's official V3 schema (Swagger 2.0), published at https://api.cc.email/v3/swagger.yaml (linked from https://developer.constantcontact.com/api_guide/v3api_schema.html). All requests go to `https://api.cc.email/v3`.

## Auth

OAuth 2.0 authorization code flow (the only supported method; Constant Contact no longer offers API-key-only access).

1. Create an application at https://app.constantcontact.com/pages/dev-portal/ (V3 developer portal, "My Applications").
2. Choose the authorization code flow and a client secret. Copy the client id and the secret into Executor's connect page.
3. Add Executor's OAuth redirect URI shown on the connect page to the application's Redirect URIs.

Endpoints: authorization `https://authz.constantcontact.com/oauth2/default/v1/authorize`, token `https://authz.constantcontact.com/oauth2/default/v1/token` (client credentials sent with HTTP Basic). Scopes requested: `account_read`, `account_update`, `contact_data`, `campaign_data`, `offline_access` (refresh tokens).

## Known gaps

- 13 operations are skipped because they only accept the partner (`ctctPartnerAuthorizer`) authentication scheme, which is not available to normal user-created applications.
- The legacy `x-api-key` scheme is not offered: it is not sufficient on its own.
- Every create, update and delete operation requires approval.
