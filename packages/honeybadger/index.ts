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

const url = "https://mcp.honeybadger.io/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const honeybadger = defineProvider({
  name: "Honeybadger",
  hosts: ["mcp.honeybadger.io", "app.honeybadger.io"],
  auth: {
    // Dynamic client registration; the user picks the account and read-only or read/write access.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { honeybadger: honeybadger.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.honeybadger ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Honeybadger",
        description: "Errors, occurrences, Insights queries, dashboards, alarms and projects in Honeybadger.",
        icons,
      },
    ),
  }),
);
