# Disqus

Forums, threads, comments, users, categories and moderation lists (blacklists, whitelists, trusted domains) from the Disqus API 3.0, with moderation and write actions.

**Interface:** 76 hand-written tools over the official REST API at `https://disqus.com/api/3.0` (reference: https://disqus.com/api/docs/). Disqus publishes no OpenAPI document, GraphQL API or remote MCP server, so argument names, methods and allowed values were taken from each method's page in the official docs. Tools are grouped as `forums`, `threads`, `posts`, `users`, `categories` and `moderation`. Multi-value arguments are sent as repeated keys, as the API expects. Every mutation requires approval.

**Auth:**
- API keys (`keys`): register an application at https://disqus.com/api/applications/ and enter its public key (`apiKey`), secret key (`apiSecret`) and the account owner's access token (`accessToken`, shown on the application's page and non-expiring). All three are sent to `disqus.com` only: as query parameters on reads (the only form Disqus documents for GET) and in the form body on writes. Without the access token Disqus treats calls as anonymous, so it is required.
- OAuth is not offered. Disqus has an authorization-code flow (`https://disqus.com/api/oauth/2.0/authorize/`), but every API call must carry the application's public key (`api_key`). Checked live against `users/details.json` with only an `access_token`: Disqus answers `{"code":5,"response":"Invalid API key"}`. Executor's OAuth accounts expose only the access token to tools (client id and secret stay with the host), so tools could not supply the key.
- `api_secret` is sent on every request, as a query parameter on GETs. Disqus advises passing the secret only in the server-side flow; Executor runs server-side, so this is deliberate, but query strings can reach access logs.

**Known gaps:** the Disqus rate limit is 1,000 requests per hour on basic accounts. Not exposed: Aet (ad-supported export), announcements, badges, imports/exports, organizations and SaaS billing, Thread Reactions, Customer Pulse, trends, pages, topics, SSO user endpoints (`deleteSSOUser`, `updateSSOProfile`, which need a Business plan), `forums/interestingForums`, `forums/validate`, favicon/avatar endpoints and internal endpoints. `users.updateProfile` blanks any field you omit, per the docs.

**Icon:** the Disqus speech-bubble "D" mark from Simple Icons (CC0).
