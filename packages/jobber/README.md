# Jobber

Field service management: clients, properties, requests, quotes, jobs, visits, invoices, payments, expenses and users.

**Interface:** GraphQL, `https://api.getjobber.com/api/graphql` (documented at https://developer.getjobber.com/docs/). Tools are generated from the schema by introspection. Every request sends `X-JOBBER-GRAPHQL-VERSION: 2025-04-16`. Mutations require approval.

**Auth:** OAuth 2.0 only; Jobber has no personal API keys. Create an app in the Jobber Developer Center (https://developer.getjobber.com), choose the scopes (read/write per object) on the app, and add the Executor callback URL as the app's redirect URI. Enter its client ID and secret on the connect page. Jobber access tokens last 60 minutes and are refreshed with the refresh token. Authorization endpoints are `https://api.getjobber.com/api/oauth/authorize` and `/api/oauth/token`. Jobber's docs site returns 403 to automated fetches, so they were not checked against the vendor docs directly (both routes exist and redirect to login). The token request sends client credentials in the body.

**Icon:** Jobber publishes no SVG press kit; the mark is the official app icon (512px) from the App Store listing.

**Known gaps:** available tools depend on the scopes granted to the OAuth app. The API version is pinned and must be bumped manually when Jobber retires it. Not exercised against a live account. The apps oauth2 type has no PKCE option, so the host's default applies and whether Jobber accepts a code_challenge is unconfirmed. Whether the pinned version is still supported by Jobber was not verifiable (changelog blocked); the server accepts any version header value unauthenticated. The health check (`{ account { id name } }`) was only validated against the schema, not a live token, and may fail for apps with very narrow scopes.
