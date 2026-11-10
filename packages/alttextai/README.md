# AltText.ai

Generates and manages AI alt text for images: create, list, fetch, update, delete and search images in the library, bulk create, scrape alt text from a page, and read or update account settings.

- Interface: OpenAPI, from AltText.ai's official document at https://alttext.ai/openapi.yml (API base `https://alttext.ai/api/v1`).
- Auth: API key only (sent as the `X-API-Key` header). Create one under Account > API Keys at https://alttext.ai/account/api_keys. AltText.ai offers no OAuth for user-created apps.
- Icon: the vendor's own vector favicon SVG (https://assets.alttext.ai/assets/favicons/favicon-d7c7484206382e9ad984b40d4b4654461f8a3593f1f47cfdcb869ef543b619ff.svg). It is a 16x16 favicon rather than a brand-page logo, but is the product mark from the vendor's host.
- Official MCP server: AltText.ai also publishes a local stdio MCP server, https://github.com/alttextai/alttext-mcp (npm `@alttext_ai/alttext-mcp`, about 12 tools). It is not a remote endpoint and offers no materially more than this package's 10 OpenAPI operations, so this package uses the OpenAPI document; the MCP server is the local alternative.
- Gaps: the `ImageEvent` webhook definition in the spec is a callback description, not a callable operation.
