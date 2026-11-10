# DocuPotion

Generates PDF and PNG documents from reusable DocuPotion templates and structured data. Three tools: `account` (usage and quota), `listTemplates`, and `createDocument` (approval required, counts against the quota).

Interface: hand-written tools over the REST API at `https://api.docupotion.com/v1`, documented at https://docupotion.com/api-docs. DocuPotion publishes no OpenAPI document, no GraphQL API and no MCP server, and the API has only these three endpoints.

Auth: API key only. Create it in the DocuPotion dashboard under the API Integration tab; it is sent as `Authorization: Bearer <key>`. DocuPotion has no OAuth.

Known gaps: templates are designed in the DocuPotion editor, so there are no tools to create or edit them. `createDocument` with the default `base64` output returns the whole file inline; prefer `output: "url"`. The health check uses `GET /account` because there is no dedicated key-validation endpoint.
