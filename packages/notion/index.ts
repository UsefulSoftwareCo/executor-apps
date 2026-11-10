import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";
import { notionVersion, withNotionVersion } from "./version.js";

// Notion's official remote MCP server. It registers clients itself (dynamic client registration and
// Client ID Metadata Documents), so signing in needs no integration of the user's own.
const mcpUrl = "https://mcp.notion.com/mcp";

const notion = defineProvider({
  name: "Notion",
  hosts: ["mcp.notion.com", "api.notion.com"],
  auth: {
    // First, so the connect page starts with it. Its tokens only work on the MCP server.
    oauth: oauth2({ discover: mcpUrl }),
    // An internal integration's secret, from notion.so/profile/integrations. Only the REST API takes it.
    token: secrets({
      label: "Internal integration secret",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health(check) {
    if (check.account.method === "oauth")
      return mcpHealth(check, {
        url: mcpUrl,
        headers: { Authorization: `Bearer ${check.account.fields.access_token}` },
      });
    const response = await check.fetch("https://api.notion.com/v1/users/me", {
      signal: check.signal,
      headers: { Authorization: `Bearer ${check.account.fields.token}`, "Notion-Version": notionVersion },
    });
    const me = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { notion: notion.many() } }, icons },
  async ({ user, cache, fetch, signal }) => {
    const accounts = user?.accounts.notion ?? [];
    return {
      tools: router(
        {
          mcp: router(
            await accountRouter(
              accounts.flatMap((account) => (account.method === "oauth" ? [account] : [])),
              async (account) =>
                withApprovals(
                  await mcpRouter({
                    url: mcpUrl,
                    account,
                    headers: { Authorization: `Bearer ${account.fields.access_token}` },
                    cache,
                    signal,
                  }),
                  (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
                ),
              { signal },
            ),
            {
              title: "Notion MCP",
              description: "Notion's MCP server: search, fetch, create and update pages, databases and comments.",
            },
          ),
          api: router(
            await accountRouter(
              accounts.flatMap((account) => (account.method === "token" ? [account] : [])),
              (account) =>
                withApprovals(
                  liveOpenapiRouter({
                    ...options,
                    cache,
                    fetch: withNotionVersion(fetch),
                    signal,
                    account,
                  }),
                  (tool) => (tool.kind === "mutation" ? always() : undefined),
                ),
              { signal },
            ),
            {
              title: "Notion API",
              description:
                "Pages, data sources, databases, blocks, comments, users and search through Notion's REST API, for accounts connected with an internal integration secret.",
            },
          ),
        },
        {
          title: "Notion",
          description:
            "Pages, databases, blocks, comments, users and search in Notion workspaces, through Notion's MCP server (mcp) for signed-in accounts and the REST API (api) for internal integrations.",
          instructions:
            "Accounts connected by signing in with Notion use the mcp tools; accounts connected with an internal integration secret use the api tools.",
          icons,
        },
      ),
    };
  },
);
