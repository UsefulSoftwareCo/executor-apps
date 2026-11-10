# Passportal

N-able Passportal documentation: list and read documents (assets, applications, contacts, locations and other templates) and create or update them.

**Interface:** custom tools written with `fetch` against the Passportal API v2 (https://documentation.n-able.com/passportal/userguide/Content/api/api_overview.htm). Passportal publishes no OpenAPI file; its Swagger UI is served by each instance at `https://<instance>.passportalmsp.com/api/documentation/v2/swagger` and needs a login, so tools cover the documented Documents endpoints: list, get, create batch, update/replace one, update/replace batch. Mutations always ask for approval.

**Auth:** API access key. In the Passportal dashboard go to Settings > API Keys > Create access key and copy the Access Key ID and Secret Access Key. The connect form asks for:

- Base URL: your dashboard origin, for example `https://us-clover.passportalmsp.com`.
- Access Key ID and Secret Key.

Each tool call signs the fixed message `api-content-hash` with HMAC-SHA256 (hex, keyed by the secret key) and exchanges it with the key ID at `/api/v2/auth/client_token` (scope `docs_api`) for an access token, sent as `x-access-token`. The secret key is therefore readable by the app. No OAuth is offered by Passportal.

**Known gaps:** only the Documents API is documented publicly. Credentials go only to `*.passportalmsp.com` (one subdomain level); instances on other domains are refused. The documented request bodies for the batch create/update endpoints are sketchy, so those tools pass the supplied list through as the JSON body. A token is minted per call (no caching).

Icon: the Passportal mark served by Passportal's own login page.
