# LiveSession

Session replay and product analytics with LiveSession: list recorded sessions (filter by visitor, email and date), and manage alerts, webhooks and websites.

Interface: OpenAPI. The spec is LiveSession's own REST API description, published in the official `livesession/livesession-docs` repository (https://github.com/livesession/livesession-docs/blob/master/api/rest/openapi.yaml); the API lives at `https://api.livesession.io/v1`. LiveSession serves no spec from its own domain.

Auth: a personal access token, sent as `Authorization: Bearer <token>`. Create one in LiveSession under Settings, API Tokens: name it, choose the website and grant scopes (`users.sessions:read`, `alerts:*`, `webhooks:*`, `websites:*`). The spec marks only the sessions operation as accepting a token and the rest as OAuth-only; the package sends the token as a bearer credential for all operations on the assumption (from the docs' token scope picker, which lists alerts, webhooks and websites) that it works for them, which is unverified without a live account. The default rate limit is 2 requests per second per token.

Known gaps: the spec's OAuth flow is for LiveSession partner integrations, which need a client registered by LiveSession, so it is not offered. The GraphQL API (funnels) has no public endpoint documented outside the docs' schema reference, so it is not exposed.
