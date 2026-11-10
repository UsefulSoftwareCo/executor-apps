# DocuSeal

Covers the DocuSeal REST API: templates, submissions, submitters and signed documents (create, send, track, archive).

Interface: OpenAPI, from DocuSeal's official document at https://console.docuseal.com/openapi.yml (`https://api.docuseal.com`). DocuSeal also offers an OAuth-protected MCP server at https://docuseal.com/mcp; the REST API was chosen as it is complete and works with a plain key.

Auth: API key plus a region field (`global` for api.docuseal.com, `eu` for api.docuseal.eu). Create it at https://console.docuseal.com/api (https://console.docuseal.eu/api for EU accounts); it is sent as the `X-Auth-Token` header. No OAuth is offered for the REST API.

Known gaps: self-hosted DocuSeal instances are not supported (only the global and EU clouds).
