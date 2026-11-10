# Trustpilot

Trustpilot's public and business APIs: business unit profiles and search, service and product reviews, categories, consumer profiles, resources, plus (for business accounts) replying to and tagging reviews, review invitations, locations, the product catalog and conversations.

Interface: hand-written tools over the REST API documented at https://developers.trustpilot.com. Trustpilot publishes no downloadable OpenAPI document, so the tools cover the documented endpoints one by one; request and query bodies are passed as `params` / `body` objects as documented there. Hosts: `api.trustpilot.com` and `invitations-api.trustpilot.com`.

Auth (the account type decides which tools appear):

- API key: the public endpoints (`apikey` header). Request an API key from the Trustpilot developer portal (https://developers.trustpilot.com, "Get started"); keys for the business API come from your Trustpilot account manager or the business app's Integrations settings.
- OAuth (authorization code): business endpoints with a business user's bearer token. The client ID is your API key and the client secret is your API secret. The redirect URI must be https and registered with Trustpilot; use the redirect URI Executor shows on the connect page. Authorization endpoint `https://authenticate.trustpilot.com`, token endpoint with HTTP Basic client authentication, no PKCE (Trustpilot documents none). The redirect URI must be https and registered with Trustpilot when the API key is issued, and must match exactly. Access tokens last about 100 hours and refresh tokens 30 days; Trustpilot documents refresh as accepted on the same accesstoken endpoint the package declares (its separate /refresh endpoint is an alternative), so refresh should work, but it is untested here. After the refresh token expires, reconnect.
- Client credentials: the same business endpoints with a token not tied to a user (no refresh). Tools take an optional `businessUserId`, sent as `x-business-user-id`.

Known gaps: no consumer display-name creation (it needs a consumer-authenticated token, which an API key is not); no business-signup writes, no location create/update and no review-invitation templates beyond listing; business-unit find-by-domain is not included. An OAuth or client-credentials account cannot call the public endpoints (the API key is not exposed to app code); connect a second API-key account for those. Account health is only verified for API-key accounts.
