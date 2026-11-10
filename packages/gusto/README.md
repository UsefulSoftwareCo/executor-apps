# Gusto

Employees, contractors, departments, compensation, payroll runs, pay schedules, time sheets and time off in Gusto, plus payroll updates and submission for accounts where Gusto enables them.

**Interface:** Gusto's official remote MCP server, `https://mcp.api.gusto.com/anthropic` (the Claude-oriented endpoint of `https://mcp.api.gusto.com`, which is the endpoint Gusto documents at https://gusto.com/product/integrations/gusto-mcp). Tools are discovered from the server at runtime; non-read-only tools require approval. Gusto's REST API publishes OpenAPI 3.1 definitions per operation on the reference pages at docs.gusto.com (title "Gusto API"), but there is no whole-spec URL (openapi.json and openapi.yaml 404), so it is not a stable single-URL spec. The REST API demo app is self-serve at dev.gusto.com, while production access needs Gusto review. MCP is used because it is the official route to the production payroll tools for an admin with no partner approval.

**Auth:** OAuth only. The server publishes OAuth metadata (`https://mcp.api.gusto.com/.well-known/oauth-authorization-server`) and supports dynamic client registration with PKCE, so Executor discovers everything from the URL and the redirect URI is registered automatically. At the consent screen the user picks the data categories to share. Only primary admins or full access admins can connect (per Gusto's OAuth2 docs). No scopes are requested; the consent screen decides the data categories. Access tokens last 7200 s and refresh tokens are single-use per Gusto, so rotation depends on the framework storing the new refresh token (unverified without a live account). There is no API key method.

**Known gaps:** No tool list is published, so the count depends on the connected account. Running payroll is limited to some Gusto customers. The Embedded Payroll REST API, webhooks and the demo environment (`api.gusto-demo.com`) are not exposed.

Icon: Gusto's wordmark from Simple Icons; it is the vendor's only logo.
