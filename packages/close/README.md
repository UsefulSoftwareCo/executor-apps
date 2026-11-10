# Close

Close CRM: leads, contacts, opportunities, calls, emails, SMS, notes, tasks, sequences, custom fields and the rest of the Close REST API (302 tools, 0 skipped).

**Interface:** Close's official OpenAPI 3.1 document, https://developer.close.com/openapi.yaml, against `https://api.close.com/api/v1`. Close also runs a remote MCP server (https://mcp.close.com/mcp, documented at https://developer.close.com/mcp.md; OAuth with dynamic client registration or API key headers); the REST document exposes far more operations, so it is used instead.

**Auth**

- API key: create one in Close under Settings > Developer > API Keys. Sent as HTTP Basic auth with the key as the username and an empty password.
- OAuth 2.0: create an OAuth app under Settings > Developer > OAuth Apps (https://app.close.com/settings/developer/oauth-apps) and enter its client ID and secret on the connect page. The app's redirect URL must use https; Close rejects plain http. Close grants every OAuth app `all.full_access offline_access`.

**Known gaps:** none known. Mutations require approval.
