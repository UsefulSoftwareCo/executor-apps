# Etsy

Etsy Open API v3: shops, listings and inventory, images and videos, receipts and transactions, shipping profiles, payments, reviews, user addresses and taxonomy (105 tools, 42 of them mutations, each of which asks for approval).

Interface: Etsy's official OpenAPI 3.0 document, https://www.etsy.com/openapi/generated/oas/3.0.0.json, served from `https://openapi.etsy.com`.

Auth: one method, "API key and OAuth access token". Etsy requires both on nearly every call.
- `apiKey`: the `x-api-key` header, in the form `keystring:shared_secret`. Create an app at https://www.etsy.com/developers/your-apps; both values are on its page.
- `accessToken`: an OAuth 2.0 bearer token for the shop owner, obtained with the authorization code + PKCE flow (https://developers.etsy.com/documentation/essentials/authentication). Register the app's redirect URI when you run that flow yourself.

Known gaps: there is no in-Executor OAuth sign-in, because Etsy's `x-api-key` header must carry the app's client secret alongside the user's bearer token, which an Executor OAuth account cannot supply. Etsy access tokens expire after one hour, so the access token must be refreshed (refresh tokens last 90 days) and the account's value updated.
