# FlexiSign

Lists the e-signature templates in a FlexiSign workspace, reads a template's recipients and fillable fields, and creates and sends a document from a template for signature (`listTemplates`, `getTemplate`, `createDocument`).

Interface: hand-written tools over FlexiSign's REST API (`https://api.flexisign.io/v1`), as documented at https://flexisign.io/esignature-api. FlexiSign publishes no OpenAPI document and no MCP server, so the three documented endpoints are written by hand.

Auth: API key, sent as the `api-key` header. Generate it in FlexiSign at https://flexisign.io/app/integrations/flexisignapi. A key belongs to one workspace. There is no OAuth.

Known gaps: the vendor documents no pagination for `listTemplates` (it says the endpoint returns every template, default page size unknown); the optional `page` and `limit` inputs (page >= 1, limit 1-100) are unverified against the vendor docs. the API only works from existing templates (it cannot create templates or documents from scratch, list or fetch sent documents, or download signed files). The vendor documents neither the create-document response shape nor the unit of `expiresIn`. Health check lists templates.
