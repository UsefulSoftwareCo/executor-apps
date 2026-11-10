# Nutshell

Nutshell CRM: leads, contacts, accounts (companies), activities, notes, tasks, tags, sources, products, quotes, invoices, audiences, pipelines and stages, users and more, through Nutshell's REST API.

Interface: OpenAPI 3.0 from Nutshell's developer hub (https://developers.nutshell.com). Nutshell publishes no single document at a stable URL, only one operation definition per reference page (https://developers.nutshell.com/reference/<operationId>.md, indexed at https://developers.nutshell.com/llms.txt; the index header says 113 but it lists 114). `document.json` is our own merge of those 114 page definitions, unchanged except the server URL, which the pages give without a scheme and `openapi.ts` overrides to `https://app.nutshell.com/rest`. The merge was produced by fetching each page's OpenAPI block and combining paths and components by hand; no script in this package re-runs it, so redo it when Nutshell adds endpoints. Some paths differ only by case (`/productmaps` and `/productMaps/{id}`), taken as-is from the vendor pages. 114 tools, 45 of them mutations that require approval.

## Auth

- API key (`apiKey`): HTTP Basic with the email of the Nutshell user as username and the API key as password. Create a key at https://app.nutshell.com/setup/api-key. Requests act as that user.
- No OAuth offered: the auth guide (https://developers.nutshell.com/docs/api-authentication.md) documents HTTP Basic only. Some endpoint responses and descriptions mention OAuth access tokens with a `read` scope, but no user-creatable OAuth app or token endpoint is documented, so none is offered.

## Notes

- Health check lists users (read-only).
- Not covered: the legacy JSON-RPC API (https://developers-rpc.nutshell.com), webhooks and the GraphQL API; the REST API is Nutshell's primary one.
- Icon: the acorn mark from Nutshell's site icon (512px PNG); Simple Icons has no entry.
