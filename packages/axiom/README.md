# Axiom

Query logs, traces, events and metrics in Axiom, explore datasets, and manage dashboards, monitors and notifiers.

**Interface:** Axiom's official remote MCP server, `https://mcp.axiom.co/mcp` (docs: https://axiom.co/docs/console/intelligence/mcp-server). Axiom publishes no OpenAPI document for its REST API, so the MCP server is the richest official surface. Tools are discovered from the server at runtime; tools not marked read-only require approval.

**Auth:**
- OAuth (recommended): the server publishes protected-resource metadata and supports dynamic client registration, so Executor discovers everything from the URL. The redirect URI is registered automatically. Sessions can be revoked in Axiom under Settings > Profile > Sessions.
- Personal access token: create one in Axiom under Settings > Profile > Personal access tokens, and supply your organization ID (shown in organization settings). Executor sends `Authorization: Bearer <token>` and `x-axiom-org-id: <orgId>`.

**Known gaps:** No tool list is published, so the count depends on the server. Ingestion through the REST API (`api.axiom.co`, edge endpoints) and API-token-only access are not exposed.

Icon: Axiom's published logo mark (`https://axiom.co/logo/axiom-logo.svg`), recolored from white to black so the generator can render light and dark variants.
