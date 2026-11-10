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
import { always } from "apps/operations/approval";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mcpUrl = "https://mcp.fuseai.com";

const fuseai = defineProvider({
  name: "FuseAI",
  hosts: ["api.tryfuse.ai", "mcp.fuseai.com", "mcp.tryfuse.ai", "core.backend.fuseai.com"],
  auth: {
    apiKey: secrets({
      label: "API key (starts with af_)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Official MCP server: OAuth 2.1 with PKCE and dynamic client registration.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, {
        url: mcpUrl,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
    }
    const response = await fetch("https://api.tryfuse.ai/api/v1/business/me", {
      signal,
      headers: { Authorization: `Basic ${btoa(`${account.fields.token}:`)}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { fuseai: fuseai.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fuseai ?? [],
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
          return withApprovals(
            liveOpenapiRouter({ ...options, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "FuseAI",
        description:
          "Prospect and company search, lists, enrichment, smart columns, campaigns, exports and analytics in FuseAI; OAuth adds the full MCP surface (email, LinkedIn, automations, tasks).",
        icons,
      },
    ),
  }),
);
