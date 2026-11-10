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

const url = "https://api.polarsignals.com/api/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const polarSignals = defineProvider({
  name: "Polar Signals",
  // The OAuth metadata sends the code exchange and refresh to identity.polarsignals.com.
  hosts: ["api.polarsignals.com", "identity.polarsignals.com"],
  auth: {
    // The server publishes OAuth metadata and logs the user in with their Polar Signals account.
    oauth: oauth2({ discover: url, scopes: ["openid", "profile", "email", "offline_access"] }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { polarSignals: polarSignals.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.polarSignals ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Polar Signals",
        description: "Continuous profiling projects, profile types, labels and profiles in Polar Signals.",
        icons,
      },
    ),
  }),
);
