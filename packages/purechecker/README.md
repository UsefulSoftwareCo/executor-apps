# PureChecker

Verifies single or batched email addresses with PureChecker: syntax, domain, mailbox existence, disposable, disabled and risk signals. Two tools: `checkEmail` (`GET /single-check?email=...`) and `checkEmails` (`POST /bulk-check`).

**Interface:** hand-written tools over PureChecker's REST API (`https://purechecker.com/api/v1`), documented at https://purechecker.com/docs. PureChecker publishes no official OpenAPI document (the only one found is a community one on Jentic, which was not used and whose response schema disagrees with the real responses) and no MCP server.

**Auth:** API credentials. Sign in to PureChecker and open the API section of the dashboard to get your user ID and secret key; they are sent as the `x-user-id` and `x-secret-key` headers. PureChecker's docs note each key use decrements credits.

**Notes:** PureChecker has no free account endpoint, so the connection health check verifies a reserved address (`postmaster@example.com`), which may consume one credit. Batch size limits are undocumented.
