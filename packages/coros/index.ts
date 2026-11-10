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

const url = "https://mcp.coros.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const coros = defineProvider({
  name: "COROS",
  // The single URL redirects to the regional server holding the user's account.
  hosts: ["mcp.coros.com", "mcpus.coros.com", "mcpeu.coros.com", "mcpcn.coros.com"],
  auth: {
    oauth: oauth2({ discover: url, scopes: ["openid", "mcp.tools", "offline_access"] }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { coros: coros.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.coros ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "COROS",
        description: "Activities, training load, sleep, HRV, workouts and training plans from a COROS account.",
        icons,
      },
    ),
  }),
);
