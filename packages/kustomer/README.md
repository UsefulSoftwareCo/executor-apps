# Kustomer

Customer service CRM: customers, conversations, messages, internal notes, companies, users, teams, queues, tags, brands, shortcuts, workflows, custom objects (KObjects) and audit logs.

**Interface:** hand-written tools over the official REST API (`https://<orgname>.api.kustomerapp.com/v1`, docs at https://developer.kustomer.com/kustomer-api-docs/reference/introduction). Kustomer publishes its OpenAPI only as per-endpoint fragments inside its docs portal (downloads are disabled, no stable URL), so a compiled spec was not possible. Kustomer also runs an official remote MCP server (`https://server.mcp.kustomerapp.com/mcp`), but it is read-only, limited to customers and conversations, and needs an admin to install the Kustomer MCP app first, so it was not used. Tools take path ids, `query` URL parameters and a JSON `body`. Search endpoints are POST but exposed as read-only queries. Every other write needs approval.

**Auth:** API key. An admin creates one at Settings > Security > API Keys in Kustomer, choosing a role that limits what it can do. Enter the organization name (the `<orgname>` in the host; a full host such as `acme.api.prod2.kustomerapp.com` is also accepted for the second pod) and the key. Requests send `Authorization: Bearer <key>`. OAuth is not offered: Kustomer documents API keys only for the REST API.

**Known gaps:** no tools for tracking events, notifications, KB articles, reports, or admin settings beyond the listed resources; endpoint paths follow Kustomer's v1 reference and were not exercised against a live org.
