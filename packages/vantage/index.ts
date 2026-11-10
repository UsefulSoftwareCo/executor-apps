import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  oauth2,
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

const mcpUrl = "https://mcp.vantage.sh/mcp";

const Workspaces = object({ workspaces: array(object({ token: string() })) });

const vantage = defineProvider({
  name: "Vantage",
  hosts: ["api.vantage.sh", "mcp.vantage.sh"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Official hosted MCP server: OAuth with dynamic client registration (https://mcp.vantage.sh/register).
    oauth: oauth2({ discover: "https://mcp.vantage.sh" }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, {
        url: mcpUrl,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
    }
    const response = await fetch("https://api.vantage.sh/v2/workspaces", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, Workspaces);
  },
});

export default defineApp(
  { user: { accounts: { vantage: vantage.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vantage ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            );
          }
          return withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          );
        },
        { signal },
      ),
      {
        title: "Vantage",
        description:
          "Cloud cost management: cost reports, folders, budgets, anomalies, recommendations, tags, providers and integrations.",
        icons,
      },
    ),
  }),
);
