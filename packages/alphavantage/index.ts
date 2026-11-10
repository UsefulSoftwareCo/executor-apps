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

const url = "https://mcp.alphavantage.co/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

// The server's bearer route is OAuth only. The legacy `?apikey=` URL form is deprecated by the
// vendor and cannot be used with mcpHealth, which retries the same URL without credentials.
const alphavantage = defineProvider({
  name: "Alpha Vantage",
  hosts: ["mcp.alphavantage.co"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration. The user enters
    // their Alpha Vantage API key on the vendor's authorize page.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { alphavantage: alphavantage.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.alphavantage ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Alpha Vantage",
        description: "Market data from Alpha Vantage: stock, forex, crypto and commodity prices, fundamentals, economic indicators, news sentiment and technical indicators.",
        icons,
      },
    ),
  }),
);
