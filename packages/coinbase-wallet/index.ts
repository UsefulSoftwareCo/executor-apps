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

const url = "https://wallet-mcp.coinbase.com";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const coinbaseWallet = defineProvider({
  name: "Coinbase Wallet",
  hosts: ["wallet-mcp.coinbase.com"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration (public PKCE client).
    oauth: oauth2({ discover: url, scopes: ["agent_wallet:transact"] }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { coinbaseWallet: coinbaseWallet.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.coinbaseWallet ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Coinbase Wallet",
        description: "Wallet balances, transfers, swaps, signing, x402 payments and transaction history in Coinbase Wallet.",
        icons,
      },
    ),
  }),
);
