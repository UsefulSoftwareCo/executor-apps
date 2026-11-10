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

const url = "https://mcp.breeze.pm/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const breeze = defineProvider({
  name: "Breeze",
  hosts: ["mcp.breeze.pm", "id.breeze.pm"],
  auth: {
    // Breeze advertises dynamic client registration; "read" is view-only, "write" allows changes.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { breeze: breeze.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.breeze ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Breeze",
        description: "Projects, cards, lists, todos, comments, time entries and reports in Breeze.",
        icons,
      },
    ),
  }),
);
