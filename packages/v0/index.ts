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

const mcpUrl = "https://v0.app/api/mcp";

const v0 = defineProvider({
  name: "v0",
  hosts: ["api.v0.dev", "v0.app"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Official v2 MCP server: OAuth with dynamic client registration.
    oauth: oauth2({ discover: "https://v0.app" }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, {
        url: mcpUrl,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
    }
    const response = await fetch("https://api.v0.dev/v1/user", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ id: string() }));
    return {};
  },
});

export default defineApp(
  { user: { accounts: { v0: v0.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.v0 ?? [],
        async (account) =>
          account.method === "oauth"
            ? withApprovals(
                await mcpRouter({
                  url: mcpUrl,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              )
            : withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                tool.kind === "mutation" ? always() : undefined,
              ),
        { signal },
      ),
      {
        title: "v0",
        description: "Generate and manage web apps with v0: chats, messages, versions, projects, deployments, hooks, environment variables and MCP servers.",
        icons,
      },
    ),
  }),
);
