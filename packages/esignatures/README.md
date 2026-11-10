# eSignatures

Send contracts for e-signature with [eSignatures.com](https://esignatures.com): create and send contracts from templates, edit contract text, manage signers and placeholder fields, withdraw contracts, and manage templates, collaborators, contract links and users. The tools an account gets depend on how it connects.

## Interface

- **OAuth accounts** mount the official hosted MCP server at <https://esignatures.com/mcp> (Streamable HTTP, docs at <https://esignatures.com/docs/mcp>). It exposes 36 tools per the vendor docs (the open-source repo README says 31; the hosted server is the authority), including contracts, contract links, templates, collaborators and users. Every tool without `readOnlyHint` requires approval.
- **Secret token accounts** use 24 hand-written tools against the official REST API (<https://esignatures.com/docs/api>, v1.3; there is no OpenAPI document). The MCP server cannot be reached with a secret token. The REST path adds `contracts.generatePdfPreview`, which the MCP lacks. Mutations require approval.

## Auth

- **OAuth** (`oauth`): discovered from `https://esignatures.com`; the server uses Client ID Metadata Documents, so there is nothing to register by hand. Sign in at eSignatures.com and approve access. No scopes are documented, so none are requested. Tokens can be revoked in your eSignatures.com account settings.
- **Secret token** (`apiKey`): the REST API uses HTTP Basic Auth with the secret token as the username and an empty password. Find the token on the Automation & API page after logging in. Credentials are sent only to `esignatures.com`.

## Known gaps

- `templates.duplicate` (REST) omits the vendor's `target_secret_token` option, which copies a template into another account. It would pass a second account's secret through tool arguments; connect that account separately instead.
- Webhooks (configured in the eSignatures.com dashboard) are not exposed.
- REST `contracts.get` should not be polled: the API rate-limits it and contracts older than two weeks can return incomplete data. Signed-PDF links expire after three days.
- The REST path has no contract-link or user tools; use an OAuth account for those.
