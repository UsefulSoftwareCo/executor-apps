import {
  accountRouter,
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
import { icons } from "./icon.js";

const url = "https://mcp.axiom.co/mcp";

type Account =
  | { method: "token"; fields: { token: string; orgId: string } }
  | { method: "oauth"; fields: { access_token: string } };

// A personal access token needs the organization id; OAuth tokens are already scoped to the user's session.
const headers = (account: Account): Record<string, string> =>
  account.method === "oauth"
    ? { Authorization: `Bearer ${account.fields.access_token}` }
    : { Authorization: `Bearer ${account.fields.token}`, "x-axiom-org-id": account.fields.orgId };

const axiom = defineProvider({
  name: "Axiom",
  hosts: ["mcp.axiom.co", "authorization.axiom.co"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }), orgId: string({ minLength: 1 }) }),
    }),
    // Axiom advertises dynamic client registration for its MCP server.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { axiom: axiom.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.axiom ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Axiom",
        description: "Query logs, traces and metrics and manage datasets, dashboards, monitors and notifiers in Axiom.",
        icons,
      },
    ),
  }),
);
