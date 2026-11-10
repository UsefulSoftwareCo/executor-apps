import {
  accountRouter,
  array,
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
import { liveOpenapiRouter } from "apps/openapi";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mcpUrl = "https://mcp.scorecard.io/mcp";

const Projects = object({ data: array(object({ id: string() })) });

const scorecard = defineProvider({
  name: "Scorecard",
  hosts: ["api2.scorecard.io", "mcp.scorecard.io", "clerk.scorecard.io"],
  auth: {
    apiKey: secrets({
      label: "API key (starts with ak_)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The MCP server publishes OAuth metadata (Clerk) with dynamic client registration.
    oauth: oauth2({ discover: mcpUrl, resource: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch("https://api2.scorecard.io/api/v2/projects?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, Projects);
  },
});

export default defineApp(
  { user: { accounts: { scorecard: scorecard.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.scorecard ?? [],
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
        title: "Scorecard",
        description:
          "Manage Scorecard evaluation projects, testsets, testcases, systems, metrics, runs, records and scores through its REST API or remote MCP server.",
        icons,
      },
    ),
  }),
);
