# Document360

Manage Document360 knowledge bases: projects, articles, categories, versions, readers, teams, analytics and AI features.

**Interface:** OpenAPI, from Document360's official v3 Customer API document at
https://apihub.document360.io/swagger/v3/swagger.json (152 paths). Every mutation requires approval.

**Auth:** API key. In the Document360 portal go to Settings > Knowledge base portal > API keys and click
Create API key (choose "Enhanced keys (v3)" if the older screen shows two tabs). The key looks like `d360_sk_...`
and is sent in the `X-API-Key` header. The older v1/v2 `api_token` does not work. API access depends on your
subscription plan; without it every call returns 403 `FEATURE_NOT_IN_LICENSE`. The spec also lists an OAuth 2.0
flow, but it uses Document360's own first-party client with PKCE and no user-registered apps, so it is not offered.

**Known gaps:** only the default Europe host (`apihub.document360.io`) is supported. Accounts on the US data center
(`apihub.us.document360.io`), Canada, or private hosting will not authenticate.
