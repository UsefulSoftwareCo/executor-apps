# FullEnrich

Find work emails and phone numbers (bulk enrichment and reverse email lookup), search and look up people and companies, and check credit balance with FullEnrich.

Interface: OpenAPI, FullEnrich's official v2 document at https://docs.fullenrich.com/api/v2/reference/openapi.yaml (API origin https://app.fullenrich.com/api/v2). Enrichment calls are asynchronous: start a bulk job, then fetch the result with the matching Get tool. Webhook delivery is not usable from Executor, so poll the Get tools. Mutations (including credit-spending enrichments and searches) require approval.

Auth: API key only (FullEnrich has no user-created OAuth apps). Create the key in the FullEnrich API dashboard at https://app.fullenrich.com/app/api; it is sent as `Authorization: Bearer <key>`. Health check calls `/account/keys/verify`.

Known gaps: only the v2 API is covered, not the deprecated v1 document. FullEnrich also offers an MCP server, not used here because the OpenAPI document is complete.
