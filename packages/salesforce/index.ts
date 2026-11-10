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

// Salesforce's hosted MCP servers live on one global host; each tool runs as the signed-in user.
const base = "https://api.salesforce.com/platform/mcp/v1/platform";
const servers = {
  records: `${base}/sobject-all`,
  actions: `${base}/invocable-actions`,
  flows: `${base}/flows`,
  apiCatalog: `${base}/api-catalog`,
} as const;

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const salesforce = defineProvider({
  name: "Salesforce",
  hosts: ["api.salesforce.com", "login.salesforce.com"],
  auth: {
    // The org's External Client App supplies the client; the MCP servers require the mcp_api scope.
    oauth: oauth2({ discover: servers.records }),
  },
  health: (check) => mcpHealth(check, { url: servers.records, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { salesforce: salesforce.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.salesforce ?? [],
        async (account) => {
          const approve = (tool: Parameters<typeof toolAnnotations>[0]) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always();
          const mount = async (url: string) =>
            withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), approve);
          return router({
            records: await mount(servers.records),
            actions: await mount(servers.actions),
            flows: await mount(servers.flows),
            apiCatalog: await mount(servers.apiCatalog),
          });
        },
        { signal },
      ),
      {
        title: "Salesforce",
        description:
          "Query and change Salesforce records, run invocable actions and flows, and browse the org's API catalog.",
        icons,
      },
    ),
  }),
);
