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

const mcpUrl = "https://mcp.docsautomator.co/mcp";

const docsautomator = defineProvider({
  name: "DocsAutomator",
  hosts: ["api.docsautomator.co", "mcp.docsautomator.co"],
  auth: {
    // Workspace API key: accepted by the REST API and, as a bearer token, by the MCP server.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The MCP server publishes OAuth metadata with dynamic client registration (public client, PKCE).
    // The REST API is not documented to accept these tokens, so OAuth accounts get the MCP tools only.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch("https://api.docsautomator.co/queue/stats", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { docsautomator: docsautomator.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docsautomator ?? [],
        async (account) => {
          const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
          const mcp = withApprovals(
            await mcpRouter({ url: mcpUrl, account, headers: { Authorization: `Bearer ${token}` }, signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          );
          if (account.method === "oauth") return router({ mcp });
          const rest = withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          );
          return router({ rest, mcp });
        },
        { signal },
      ),
      {
        title: "DocsAutomator",
        description:
          "Generate PDFs and Google Docs from templates, manage automations, templates, placeholders, data sources and e-signature sessions with DocsAutomator.",
        icons,
      },
    ),
  }),
);
