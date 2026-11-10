import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://app.baremetrics.com/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// API keys and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const baremetrics = defineProvider({
  name: "Baremetrics",
  hosts: ["app.baremetrics.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata and dynamic client registration (scopes read, write).
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { baremetrics: baremetrics.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.baremetrics ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Baremetrics",
        description: "Subscription analytics in Baremetrics: MRR, churn, customers, plans, subscriptions and revenue metrics.",
        icons,
      },
    ),
  }),
);
