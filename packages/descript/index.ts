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
import { liveOpenapiRouter } from "apps/openapi";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mcpUrl = "https://api.descript.com/v2/mcp";

const descript = defineProvider({
  name: "Descript",
  hosts: ["descriptapi.com", "api.descript.com", "auth.descript.com"],
  auth: {
    // Personal API token from Descript Settings, used against the REST API.
    token: secrets({
      label: "Personal API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The MCP server publishes OAuth metadata with dynamic client registration. Discovery
    // requests offline_access, which covers every MCP tool and returns a refresh token.
    // Clients are third-party Stytch Connected Apps; full_access gets invalid_scope.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch("https://descriptapi.com/v1/status", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ api_version: string() }));
  },
});

export default defineApp(
  { user: { accounts: { descript: descript.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.descript ?? [],
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
        title: "Descript",
        description:
          "Descript projects, media import, Underlord agent jobs, transcript export and publishing through the REST API (API token) or the remote MCP server (OAuth).",
        icons,
      },
    ),
  }),
);
