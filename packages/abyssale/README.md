# Abyssale

Creative automation with Abyssale: list designs and projects, generate images
(synchronously) and videos, GIFs, HTML5 banners and print PDFs (asynchronously),
import designs from JSON, duplicate workspace templates, create dynamic image
URLs, list fonts, check credits and manage webhook signing secrets.

**Interface:** Abyssale's official OpenAPI 3.0 document at
https://developers.abyssale.com/api.yaml (linked from the API reference at
https://developers.abyssale.com/api-reference/). It describes every REST
endpoint on `https://api.abyssale.com`. Abyssale also runs a remote MCP server
(`https://mcp.abyssale.com/mcp`), but it only accepts OAuth for registered
clients, so this package uses the REST API. Every mutation asks for approval.

**Auth:** API key. Create a workspace API key in the Abyssale app under
Workspace settings (API keys) and paste it when connecting. It is sent in the
`x-api-key` header. Use a workspace key, not a user-scoped key: user keys only
reach `/auth`, `/fonts` and plugin endpoints. API access needs a plan that
includes it (a trial includes some credits). No OAuth: Abyssale lets users
create only API keys.

**Known gaps:** the spec marks 7 operations as deprecated; they are still exposed as tools. Generation spends credits, so generate calls are approval
gated. Asset files are uploaded to presigned S3 URLs during design import; that
upload step happens outside the API and is not a tool. Webhook deliveries are
not exposed as triggers.
