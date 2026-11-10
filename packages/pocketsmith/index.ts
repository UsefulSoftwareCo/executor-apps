import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
  object,
  router,
  toolAnnotations,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mcpUrl = "https://mcp.pocketsmith.com/mcp";

const pocketsmith = defineProvider({
  name: "PocketSmith",
  hosts: ["api.pocketsmith.com"],
  auth: {
    apiKey: secrets({
      label: "Developer key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.pocketsmith.com/v2/me", {
      signal,
      headers: { "X-Developer-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ id: number() }));
  },
});

// The official MCP server publishes OAuth metadata and dynamic client registration.
const pocketsmithMcp = defineProvider({
  name: "PocketSmith MCP",
  hosts: ["mcp.pocketsmith.com"],
  auth: {
    oauth: oauth2({ discover: "https://mcp.pocketsmith.com" }),
  },
  health: (check) =>
    mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { pocketsmith: pocketsmith.many(), pocketsmithMcp: pocketsmithMcp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.pocketsmith ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        mcp: await accountRouter(
          user?.accounts.pocketsmithMcp ?? [],
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
      },
      {
        title: "PocketSmith",
        description:
          "Manage PocketSmith budgets: accounts, transactions, categories, budgets, events, attachments and forecasts. The api group uses a developer key; the mcp group (OAuth) adds financial insights, forecasts, data feed status and deep links.",
        icons,
      },
    ),
  }),
);
