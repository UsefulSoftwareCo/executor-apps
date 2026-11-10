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

const mcpUrl = "https://felt.com/mcp";

const felt = defineProvider({
  name: "Felt",
  hosts: ["felt.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Official remote MCP server: OAuth in the browser with dynamic client registration.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch("https://felt.com/api/v2/user", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    // The OpenAPI User schema has no required list; this relies on FeltID being non-nullable.
    await decodeJson(response, object({ id: string() }));
    return {};
  },
});

export default defineApp(
  { user: { accounts: { felt: felt.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.felt ?? [],
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
        title: "Felt",
        description: "Create and manage Felt maps: maps, layers, elements, projects, data sources, exports and comments. OAuth accounts use the official MCP server, which adds SQL over layers, spatial analysis, feature editing and map rendering.",
        icons,
      },
    ),
  }),
);
