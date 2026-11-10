# TapClicks

Covers the TapClicks (TapReports, TapAnalytics and TapOrders) API v2: clients, client groups and categories, clusters, reporting profiles, services and their data views, users and roles, executive summaries, leads and orders.

Interface: OpenAPI 3.0 document that TapClicks publishes in its public-api-documentation repository, the file its API docs page renders: https://bitbucket.org/tapeng/public-api-documentation/raw/master/spec/swagger.yaml (docs: https://apidocs.tapclicks.com/v2/6.27/index.html). Base URL https://api.tapclicks.com/v2. Every write operation asks for approval.

Auth: OAuth 2.0 client credentials. Request API credentials with the form linked in the TapClicks API docs (the Client ID and Client Secret are emailed to the TapClicks super admin within 24-48 hours), then enter them on the connect page. Executor exchanges them at https://api.tapclicks.com/oauth/accesstoken (credentials in the request body) and renews the token when it expires. There is no browser redirect, so no redirect URI is needed.

Known gaps: the connection health check lists clients, so it needs a role that may read clients. The spec is a hand-maintained 2.6.27 document with some unusual path templates; only operations that compile are exposed (44 tools).
