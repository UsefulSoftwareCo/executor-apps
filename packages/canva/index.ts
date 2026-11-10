import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const Me = object({ team_user: object({ user_id: string(), team_id: string() }) });

const canva = defineProvider({
  name: "Canva",
  hosts: ["api.canva.com"],
  auth: {
    // Canva Connect only supports OAuth 2.0 (authorization code with PKCE); the connect page asks for an integration's client.
    oauth: oauth2({
      authorizationUrl: "https://www.canva.com/api/oauth/authorize",
      tokenUrl: "https://api.canva.com/rest/v1/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [
        "design:content:read",
        "design:content:write",
        "design:meta:read",
        "folder:read",
        "folder:write",
        "asset:read",
        "asset:write",
        "comment:read",
        "comment:write",
        "brandtemplate:meta:read",
        "brandtemplate:content:read",
        "brandtemplate:content:write",
        "profile:read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.canva.com/rest/v1/users/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: me.team_user.user_id } };
  },
});

const mcpUrl = "https://mcp.canva.com/mcp";

// Canva's MCP server has its own OAuth client registration (discovery + DCR/CIMD), separate from a
// Connect API integration, and its tokens only work against mcp.canva.com.
const canvaMcp = defineProvider({
  name: "Canva MCP",
  hosts: ["mcp.canva.com"],
  auth: {
    // Scopes are the scopes_supported list from https://mcp.canva.com/.well-known/oauth-protected-resource.
    oauth: oauth2({ discover: mcpUrl }),
  },
  health: (check) =>
    mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { canva: canva.many(), canvaMcp: canvaMcp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: router(
          await accountRouter(
            user?.accounts.canva ?? [],
            (account) =>
              withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                tool.kind === "mutation" ? always() : undefined,
              ),
            { signal },
          ),
          {
            title: "Canva Connect API",
            description:
              "Designs, assets, folders, exports, comments, brand templates and autofill through the Canva Connect REST API.",
          },
        ),
        mcp: router(
          await accountRouter(
            user?.accounts.canvaMcp ?? [],
            async (account) =>
              withApprovals(
                await mcpRouter({
                  url: mcpUrl,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
            { signal },
          ),
          {
            title: "Canva MCP",
            description:
              "Canva's remote MCP server: AI design generation, editing transactions, import from URL, export, search, brand kits, folders and comments.",
          },
        ),
      },
      {
        title: "Canva",
        description:
          "Designs, assets, folders, exports, comments, brand templates and autofill through the Canva Connect API (api), plus design generation and editing through Canva's MCP server (mcp).",
        icons,
      },
    ),
  }),
);
