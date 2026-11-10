# Formdesk

Formdesk online forms: list forms and their questions, add, read, update, delete and export results, generate PDFs, manage uploaded files, users and visitors (including single sign-on), and park prefill data for a form ticket. 37 tools.

**Interface:** custom, hand-written tools over Formdesk's official REST API v1 (docs: https://documenter.getpostman.com/view/9848031/SWEDyDrC). Formdesk publishes no OpenAPI document or MCP server. Requests go to `https://{host}/api/rest/v1/{domain}/...`. Mutations require approval.

**Auth:** API key only (Formdesk has no OAuth). Create it under Users > (a user) > Web API in your Formdesk account; the key carries that user's rights, so use a restricted user to limit access. The connect form asks for three fields:

- `API key`
- `domain`: your unique account name (folder of forms), shown in account settings.
- `host`: the server your account lives on, for example `fd7.formdesk.com`. The Connect call (`GET https://www.formdesk.com/api/rest/v1/{domain}/connect` with the key as Bearer token) returns it.

The health check uses that Connect call, which costs no credit.

**Gaps and notes:** every other call costs one Formdesk credit (export: one per completed form); new accounts get 100 free credits. The SOAP API is not covered. Binary responses (PDF, file content) are returned as base64. Request and result bodies are passed as free-form JSON keyed by the form's question identifiers.
