# Ironclad

Covers the Ironclad contract lifecycle management Public API: workflows (launch, update, cancel, pause and resume), approvals, signatures and signers, comments, documents, records and attachments, webhooks, entities, obligations, reports and adapter flows. 85 tools, 46 of them mutations that always ask for approval.

Interface: OpenAPI 3.1, Ironclad's official Public API description at https://developer.ironcladapp.com/openapi/ironclad-public-api.json (index: https://developer.ironcladapp.com/openapi). The tools call `https://na1.ironcladapp.com/public/api/v1`, `eu1` or `demo` depending on the account.

Auth:
- API token (`apiKey`): create a token in Ironclad under Company Settings > API, then enter it with your environment (`na1`, `eu1` or `demo`). This is Ironclad's legacy bearer-token mode.
- OAuth (`oauth`, North America) and OAuth EU (`oauthEu`): authorization code flow with an OAuth client you create in Company Settings > API. Register the redirect URI Executor shows on the connect page as the client's redirect URI. Ironclad's authorize and token URLs differ per environment, so each environment is its own method; Demo is reachable with an API token only.

Known gaps:
- Ironclad's official spec uses the bare `ironcladapp.com` host for the authorize and token URLs, which this package follows. API calls still go to `na1.ironcladapp.com`.
- The SCIM API (`/scim/v2`) and the OAuth userinfo endpoint are not mounted; only the Public API is.
- The client credentials grant is not offered: it needs an `x-as-user-email` header that the connect form cannot collect.
- Ironclad's spec lists the API-key and OAuth2 schemes as one combined requirement; the package fills both from the same bearer token.
- Clickwrap (pactsafe.io) is a separate product and API and is not included.
