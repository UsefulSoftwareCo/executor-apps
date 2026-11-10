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

const url = "https://mcp.mercury.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const mercury = defineProvider({
  name: "Mercury",
  hosts: ["mcp.mercury.com"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration. Read-only scopes
    // only: the server also advertises request and edit scopes for transfers and categories.
    oauth: oauth2({ discover: url, scopes: ["read", "offline_access"] }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { mercury: mercury.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mercury ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Mercury",
        description:
          "Mercury business banking: accounts, balances, transactions, cards, recipients, statements and treasury.",
        icons,
      },
    ),
  }),
);
