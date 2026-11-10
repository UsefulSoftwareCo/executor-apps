# Airtop

Cloud browser automation with Airtop: create and manage browser sessions and windows, query, scrape, summarize and monitor pages, click, type, hover, scroll, fill forms, take screenshots, manage files and profiles, and run automations.

**Interface:** Airtop's official OpenAPI 3.1 document, https://docs.airtop.ai/openapi.json (linked from the docs at https://docs.airtop.ai/llms.txt), served from `https://api.airtop.ai/api`. It describes 39 operations.

**Auth:** API key only, sent as a bearer token (`Authorization: Bearer <key>`). Create one in the Airtop Portal at https://portal.airtop.ai/api-keys. Airtop has no user-created OAuth apps for its REST API, so no OAuth is declared. The health check calls `GET /v1/sessions`.

**Approvals:** every non-read operation (creating or terminating sessions and windows, clicks, typing, form fills, file and automation changes) asks for approval.

**Known gaps:** only the operations in the official spec are covered. Airtop also runs an MCP server at https://docs.airtop.ai/_mcp/server, but that serves the documentation, not the product. No live call with a real key was made.
