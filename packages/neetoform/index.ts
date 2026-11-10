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

const mcpUrl = "https://connect.neetoform.com/mcp/messages";

const neetoform = defineProvider({
  name: "NeetoForm",
  hosts: ["connect.neetoform.com"],
  auth: {
    // Workspace API key (Admin panel, API keys); the MCP server takes it as a bearer token.
    apiKey: secrets({
      label: "Workspace API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Dynamic client registration and PKCE S256; scopes: read, write, delete, offline_access.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account } = check;
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${token}` } });
  },
});

export default defineApp(
  { user: { accounts: { neetoform: neetoform.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.neetoform ?? [],
        async (account) => {
          const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
          return withApprovals(
            await mcpRouter({ url: mcpUrl, account, headers: { Authorization: `Bearer ${token}` }, signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          );
        },
        { signal },
      ),
      {
        title: "NeetoForm",
        description: "List and search forms, read submissions, and manage workspace team members in NeetoForm.",
        icons,
      },
    ),
  }),
);
