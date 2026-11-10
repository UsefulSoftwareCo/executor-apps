# Mailboxlayer

Email address validation and verification through Mailboxlayer (APILayer): syntax check, MX lookup, SMTP check, disposable, free and role address detection, did-you-mean suggestions and a deliverability score. The API has a single operation, exposed as `check`.

**Interface:** custom tools written with `fetch` against `https://apilayer.net/api/check`. Mailboxlayer publishes no OpenAPI document, GraphQL API or MCP server; the endpoint and parameters come from the vendor's documentation at https://docs.apilayer.com/mailboxlayer/docs/api-documentation (login-gated; cross-checked against live responses).

**Auth:** API key only (Mailboxlayer has no OAuth). Copy the access key from your APILayer / Mailboxlayer dashboard (https://mailboxlayer.com/dashboard). The key is sent as the `access_key` query parameter.

**Plan requirement:** this package requires a paid Mailboxlayer plan. It always uses HTTPS, and free plans reject HTTPS (error 105, `https_access_restricted`; they only allow plain HTTP). The health check fails with a clear message for such keys.

**Health check:** Mailboxlayer has no account endpoint, so the health check sends a `/check` request with no email. A key that gets error 101, 102 or 106 is rejected, and 105 is rejected as above; a valid key is expected to get error 210. The vendor documentation could not be read, so it is unverified whether this probe is free: connecting an account may spend one credit.

**Known gaps:** The `catchAll` option needs a Professional plan or above. Errors are returned by Mailboxlayer as HTTP 200 and are turned into tool errors. A `bulk_check` endpoint was reported by a web search but could not be confirmed (the login-gated docs were unreadable), so it is not exposed.
