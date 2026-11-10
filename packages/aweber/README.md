# AWeber

Email marketing: lists, subscribers, tags, custom fields, segments, broadcasts, campaigns and statistics, landing pages, signup forms and integrations.

**Interfaces:** two, chosen by how the account signs in.

- **REST API (45 tools):** AWeber's official OpenAPI document, https://api.aweber.com/swagger.yaml. It splits its paths, parameters, responses and schemas into relative `$ref` files, which the OpenAPI compiler cannot load, so `packages/aweber/generate-openapi.py` fetches them and bundles them into `document.json` (shared schemas, parameters and responses stay components; the OAuth endpoints and documentation-only extensions are dropped). Mutations ask for approval. Re-run the script to refresh the bundle.
- **Remote MCP server (15 tools):** `https://mcp.aweber.com/mcp` (Streamable HTTP). Docs: https://docs.aweber.com/api/api/connecting-and-using-the-aweber-mcp-server, which lists subscribers (add, get, move, search, update), lists (get lists, get list tags), broadcasts (get, get one, stats, create, update, schedule), `get_signup_form_guide` and `send_feedback`. Tools are listed live from the server once an account is connected, so the set may differ. Every tool not marked read-only asks for approval.

**Auth:**

- `oauth` (MCP): OAuth 2.1 with dynamic client registration and PKCE, discovered from the server's metadata. No client has to be created by hand; sign in to AWeber and approve access. Scopes: `account.read`, `list.read`, `list.write`, `subscriber.read`, `subscriber.write`, `email.read`, `email.write`.
- `restOauth` (REST): OAuth 2.0 authorization code with an app you create at https://labs.aweber.com/apps (authorize at `https://auth.aweber.com/oauth2/authorize`, token at `https://auth.aweber.com/oauth2/token`, client sent with HTTP Basic). Add the redirect URI shown on Executor's connect page to the app, then enter its client ID and secret there. Scopes are the same seven plus `landing-page.read`.

**Known gaps:** 8 REST operations are not tools: 7 paths that carry a `?ws.op=` query (find lists, find subscribers, find campaigns, subscriber activity, account-level web forms and split tests, account-level subscriber search), which the compiler cannot address as operations, and the analytics report, which is served from a different origin. Webhooks and the legacy OAuth 1.0a endpoints are not covered.
