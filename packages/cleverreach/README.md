# CleverReach

Email marketing with CleverReach: recipients, groups, forms, mailings, reports, segments, attributes, blacklist and the rest of the REST API v3.

**Interface:** OpenAPI, from CleverReach's own Swagger 2.0 document for REST API v3, `https://rest.cleverreach.com/v3/explorer/swagger.json` (the document behind the API explorer at https://rest.cleverreach.com/explorer/). Every mutation asks for approval.

**Auth**

- Access token: a bearer token for REST API v3 (for example one minted with the client credentials flow at `https://rest.cleverreach.com/oauth/token.php`), sent as `Authorization: Bearer`.
- OAuth 2.0: create an OAuth app in CleverReach under Account > Extras > REST API > Create OAuth App, and enter its client ID and secret on the connect page. Set the app's redirect URL to the redirect URI Executor shows. Authorization is `https://rest.cleverreach.com/oauth/authorize.php` (with `grant=basic`) and tokens come from `https://rest.cleverreach.com/oauth/token.php`. CleverReach publishes no scope list, so none are requested.

**Known gaps:** the Flows API and the legacy v1/v2 APIs are not covered. The health check calls `/v3/debug/whoami`.
