# Kit

Kit (formerly ConvertKit) email marketing: subscribers, tags, forms, sequences and their emails, broadcasts and stats, custom fields, segments, purchases, snippets, email templates, creator profile and webhooks (83 tools, including the bulk endpoints).

Interface: Kit's official API v4 OpenAPI document, https://developers.kit.com/api-reference/v4.json (server https://api.kit.com). Kit also runs an account MCP server at https://app.kit.com/mcp; it requires OAuth (401 without it), so its tool count was not compared and it is not mounted.

Auth:

- API key: create one in Kit under Settings > Developer (API keys); it is sent as `X-Kit-Api-Key`. Kit documents keys as suited to your own account; the `Create purchase` and `Bulk` endpoints need OAuth.
- OAuth 2.0: create an app in the Kit App Store builder (https://app.kit.com/apps?is=created), enable API access, and add Executor's redirect URI shown on the connect page to the app's Redirect URIs. Enter the app's client ID and secret on the connect page. Tokens are exchanged at https://api.kit.com/v4/oauth/token. Kit's docs do not state the client authentication method or request body format (its samples disagree, and its refresh page sends only client_id), so this package's use of `client_secret_post` with a JSON body, and of sending client_secret on refresh, is inferred and unverified against a live Kit app. Kit's docs list the redirect URI in two places (https://app.kit.com/apps/install and https://app.kit.com/apps); use the one Executor shows. Kit currently issues only the default scope.

Known gaps: the connected account is identified by the stable account ID from `GET /v4/account` (the user's email is shown as the username). Mutations all require approval.
