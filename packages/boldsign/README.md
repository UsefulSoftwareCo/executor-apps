# BoldSign

BoldSign eSignature: send documents for signature, track and download them, manage templates, contacts and contact groups, users, teams, brands, sender identities, custom fields and embedded signing/request URLs. 87 tools (62 mutations, all approval-gated).

**Interface:** OpenAPI. BoldSign's own Swagger document, https://api.boldsign.com/swagger/v1/swagger.json, loaded live.

## Auth

- **API key** (`apiKey`): create one in BoldSign under API > API Key. Sent as the `X-API-KEY` header.
- **OAuth 2.0** (`oauth`): create an app in BoldSign under API > OAuth Apps > Create App (account admin, plan with API access). Add the Executor redirect URI shown on the connect page as the app's redirect URL, then paste the client ID and secret. Authorization code with PKCE; scopes cover Documents, Templates, Users, Teams and SenderIdentity (`.All`) plus `offline_access` for refresh tokens.

## Known gaps

- Only the US host (`api.boldsign.com`) is supported. EU and CA accounts use regional API hosts and are not covered.
- The Swagger document lists no OAuth scopes per operation, and the vendor scope list names only Documents, Templates, Users, Teams and SenderIdentity families. Contacts, brands and similar tool groups have no documented scope and may return 403 with the granted scopes; use an API key for those.
