# CompanyCam

Covers the CompanyCam v2 API: projects, photos, videos, documents, checklists, users, groups, tags, comments, webhooks and the current company.

Interface: OpenAPI, from CompanyCam's official spec repository at https://github.com/CompanyCam/openapi-spec (`openapi.yaml`, served from `https://api.companycam.com/v2`). 62 operations, 32 of them mutations (all require approval). The repo has an open issue noting some fields (for example photo coordinates) may differ from the live API.

API generation: the OpenAPI spec (Core v2) and the OAuth flow below both belong to CompanyCam's legacy API. The vendor says the legacy API is deprecated in early 2027, receives no new functionality, and points new integrations to https://developers.companycam.com. That site returned no readable content when checked, so its auth docs were not verified.

Plan requirement: per the vendor's welcome page (https://companycam.readme.io/docs/welcome), API and integration access is available only on the Pro, Premium and Elite plans. On other plans, tokens and OAuth will fail.

Auth, two methods, both sent as a Bearer token to `api.companycam.com`:
- Access token: generate one in the CompanyCam app at https://app.companycam.com/access_tokens (the vendor's Getting Started page links there and gives no menu path) and paste it in.
- OAuth 2.0 (authorization code): create an application at https://app.companycam.com/access-keys/applications, add Executor's redirect URI to it, and enter the client ID and secret on the connect page. Endpoints per https://companycam.readme.io/docs/oauth: authorize `https://app.companycam.com/oauth/authorize`, token `https://app.companycam.com/oauth/token` (form-encoded, client_secret_post). Scopes `read write destroy`, space-separated. Access tokens expire after 2 hours and refresh tokens rotate on every refresh. The vendor page is the authority, so this package offers OAuth anyway.

The health check calls `GET /v2/company`.

Known gaps: Webhook delivery to Executor is not part of this package.
