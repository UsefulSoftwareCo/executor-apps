# Thanks.io

Send direct mail with [thanks.io](https://thanks.io): postcards, magnacards, windowed and windowless letters, notecards and gift cards, plus price estimates, recipients, mailing lists (including radius searches), sub-accounts, message and image templates, creatives, webhooks, and order tracking, replay and cancellation.

Interface: OpenAPI, from the vendor's own document in its docs repository, https://raw.githubusercontent.com/thanks-io/thanks.io-api-docs/cf71253abdec0d5aedc397c16d36aafd3657b243/api-reference/openapi.json (pinned to docs-repo commit cf71253; update the SHA to pick up vendor changes) (API base https://api.thanks.io/api/v2). 49 tools, 33 of them mutations that require approval. Sending mail costs real money, so every `send` call asks first.

Auth:

- API key (bearer token): create one in the thanks.io dashboard under Settings, API Access (https://dashboard.thanks.io/app/settings/api-access).
- OAuth 2.0: register an OAuth application on the same API Access page ("Create Application") and enter its client ID and secret on the connect page. Set the redirect URI of that application to the one Executor shows. Endpoints are https://dashboard.thanks.io/oauth/authorize and https://dashboard.thanks.io/oauth/token (client credentials in the POST body, refresh tokens supported). The docs define no scopes, so none are requested.

Known gaps: the three public, unauthenticated catalogue endpoints (`/handwriting-styles`, `/giftcard-brands`, `/giftcard-brands-list`) are skipped because the document marks them as having no auth method. The health check lists mailing lists, since the API has no current-user endpoint. The icon is the envelope mark cropped from the logo at https://thanks.io/logo.png (the vendor publishes no SVG mark).
