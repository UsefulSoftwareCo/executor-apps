# Getty Images

Search creative and editorial images and video, read asset metadata, manage boards, download licensed assets, check orders and purchased assets, and generate AI images with the Getty Images API.

Interface: OpenAPI 3, Getty's official document at https://api.gettyimages.com/swagger/v3/swagger.json (the document declares no servers, so the package sets `https://api.gettyimages.com`). Every mutation asks for approval.

## Auth

- **API key** (`apiKey`): sent as the `Api-Key` header. Enough for search, metadata and affiliate endpoints. Create an app at https://developers.gettyimages.com/ (My Apps).
- **API key and OAuth access token** (`accessToken`): sends `Api-Key` plus `Authorization: Bearer`. Needed for downloads, boards, orders, purchased assets and AI generation. Obtain the token from `https://authentication.gettyimages.com/oauth2/token` with your app's key and secret (client credentials, password or authorization code grant).

## Known gaps

- Getty requires the API key (the OAuth client id) on every call alongside the bearer token. The Executor OAuth flow does not expose the client id to tool calls, so no `oauth2` method is offered; paste a token instead. Getty access tokens are short lived, so reconnect when one expires.
