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

// Mofi's official remote MCP server (Streamable HTTP). The authorization server is omofi.com.br
// itself: it advertises dynamic client registration, Client ID Metadata Documents and S256 PKCE,
// with token endpoint auth method none, so Executor's client is a public PKCE client and sign-in
// is one click. Scopes come from discovery (mcp:read, mcp:sync).
// initialize and tools/list answer without a token, so a URL import would be detected as
// anonymous; this package declares OAuth so every tool call carries the user's token.
const url = "https://omofi.com.br/api/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const mofi = defineProvider({
  name: "Mofi",
  hosts: ["omofi.com.br"],
  auth: {
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { mofi: mofi.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mofi ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), cache, signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Mofi",
        description:
          "Balances, cards, transactions, statements, recurring charges and spending from Brazilian banks connected through regulated Open Finance. Bank access is read-only and no tool moves money.",
        instructions:
          "Amounts are kept per currency. Account balances are not income and credit limits are not cash. Read-only tools run without approval; saving a category and requesting a bank sync ask first.",
        icons,
      },
    ),
  }),
);
