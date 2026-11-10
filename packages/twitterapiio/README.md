# twitterapi.io

Third-party X (Twitter) data API from twitterapi.io: user lookup, timelines, followers, tweet search, replies, lists, communities, trends, plus write actions such as tweeting and following. This is not the official X API; see the `twitter` package for that.

Interface: OpenAPI, from the vendor's own document at https://docs.twitterapi.io/api-reference/openapi.json (origin `https://api.twitterapi.io`). Every mutation requires approval.

## Auth

- API key: copy it from the dashboard at https://twitterapi.io/dashboard. Sent as the `X-API-Key` header. The health check calls `/oapi/my/info`.

## Known gaps

- No OAuth. Write actions (tweet, follow, etc.) additionally need a logged-in X account configured with twitterapi.io, as described in its docs.
- Calls consume twitterapi.io credits.
