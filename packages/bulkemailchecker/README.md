# Bulk Email Checker

Verify email addresses in real time with Bulk Email Checker: deliverability status, event code, disposable, free-provider, role, gibberish and complainer flags, typo suggestions, mail-server (MX) enrichment, and remaining credits and hourly quota.

**Interface:** hand-written tool over the documented real-time API (`https://api.bulkemailchecker.com/real-time/`, reference at https://bulkemailchecker.com/api-docs/). The vendor publishes no OpenAPI document and no remote MCP server, and documents only this one endpoint (the bulk upload and unlimited API are not specified publicly), so the package exposes one tool, `verifyEmail`. It is a query (read-only), but each passed or failed result costs one credit.

**Auth:** API key. Find it in your Bulk Email Checker account dashboard at https://bulkemailchecker.com/. It is sent as the `key` query parameter, which is how the API takes it. There is no OAuth.

**Icon:** the vendor's own app icon SVG (`https://bulkemailchecker.com/assets/images/icons/favicon.svg`); the mark is not in Simple Icons.

**Known gaps:** one address per call; bulk jobs and any credit-balance endpoint are not publicly documented (the balance comes back in each result as `creditsRemaining`). The error body shape is undocumented, and the health check verifies a malformed address, which may consume a credit.
