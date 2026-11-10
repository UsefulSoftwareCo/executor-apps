import {
  accountRouter,
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
import { icons } from "./icon.js";

const mcpUrl = "https://mcp.conveyor.com/mcp";

const conveyor = defineProvider({
  name: "Conveyor",
  hosts: ["mcp.conveyor.com", "api.conveyor.com"],
  auth: {
    // Conveyor API token (Settings > Integrations > Conveyor API), sent as a Bearer token to the MCP server.
    apiKey: secrets({
      label: "Conveyor API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // OAuth 2.1 with dynamic client registration and PKCE S256, advertised by the MCP server.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account } = check;
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${token}` } });
  },
});

export default defineApp(
  { user: { accounts: { conveyor: conveyor.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.conveyor ?? [],
        async (account) => {
          const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
          return withApprovals(
            await mcpRouter({
              url: mcpUrl,
              account,
              headers: { Authorization: `Bearer ${token}` },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          );
        },
        { signal },
      ),
      {
        title: "Conveyor",
        description:
          "Run your customer trust program with Conveyor: answer security questions, manage the knowledge base and questionnaires, Trust Center documents and access requests, and pull analytics.",
        icons,
      },
    ),
  }),
);
