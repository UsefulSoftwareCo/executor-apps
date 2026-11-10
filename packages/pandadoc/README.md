# PandaDoc

Create, send, track and e-sign documents with PandaDoc: documents, templates, contacts, content library items, forms, webhooks, folders, members and more.

**Interface:** OpenAPI. PandaDoc's official specification, published at https://github.com/PandaDoc/pandadoc-openapi-specification (`openapi.json`), is loaded live and mounted against `https://api.pandadoc.com`. Mutations require approval.

**Auth**

- API key: generate one on the Configuration page of the PandaDoc Developer Dashboard (https://app.pandadoc.com/a/#/settings/api-dashboard/configuration). Sandbox keys are self-serve; production keys need an Enterprise plan and activation by PandaDoc Sales/Support. Sent as `Authorization: API-Key <key>`.
- OAuth 2.0 (authorization code): create an OAuth application in the Developer Dashboard (same link). PandaDoc only allows creating OAuth applications with production API access enabled; a sandbox key cannot create one. Enter the application's client ID and secret on the connect page and add Executor's redirect URI shown there to the application's allowed redirect URIs (PandaDoc's docs do not say exactly where in the dashboard these are entered, so check the application form). Scopes requested: `read write`.

**Known gaps**

- File upload is unavailable through the generated tools. Seven multipart upload operations (paths carrying a `?upload` or `?upload-markdown` query) are skipped: `documents.createDocumentFromUpload`, `documents.createDocumentFromMarkdownUpload`, `documents.changeDocumentStatusWithUpload`, `documentAttachments.createDocumentAttachmentFromFileUpload`, `documentSectionsBundles.uploadSectionWithUpload`, `contentLibraryItems.createContentLibraryItemFromUpload` and `templates.createTemplateWithUpload`.
- Accounts in the EU data region (`pandadoc.eu`) are not supported; only `api.pandadoc.com` is configured.
- PandaDoc's remote MCP server (`https://mcp.pandadoc.com/v1/mcp`) exists but the REST API covers more.
- The icon is the PandaDoc app icon from its official GitHub organization avatar, since neither Simple Icons nor an SVG was available.
