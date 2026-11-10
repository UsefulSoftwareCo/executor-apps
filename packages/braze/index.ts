import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  router,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// The US endpoint reaches every Braze cluster (https://mcp.braze.eu/mcp is the EU-hosted twin).
const url = "https://mcp.braze.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const braze = defineProvider({
  name: "Braze",
  hosts: ["mcp.braze.com"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration; the authorization
    // server is dashboard.braze.com. The server advertises mcp:tools, mcp:resources and
    // mcp:operator; mcp:operator is deliberately not requested because the three Operator tools
    // are beta-gated and the docs do not say whether they need that scope.
    oauth: oauth2({ discover: url, scopes: ["mcp:tools", "mcp:resources"] }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { braze: braze.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.braze ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Braze",
        description:
          "Braze campaigns, Canvases, segments, catalogs, templates, content blocks, events, KPIs and sends. Call get_workspaces first; each workspace id is the app_group_id the other tools need.",
        icons,
      },
    ),
  }),
);
