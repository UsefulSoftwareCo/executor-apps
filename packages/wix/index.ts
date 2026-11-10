import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.wix.com/mcp";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "apiKey"; fields: { token: string; accountId: string } };

// OAuth sends a bearer token; an API key is sent bare with the Wix account id.
const headers = (account: Account): Record<string, string> =>
  account.method === "oauth"
    ? { Authorization: `Bearer ${account.fields.access_token}` }
    : { Authorization: account.fields.token, "wix-account-id": account.fields.accountId };

const wix = defineProvider({
  name: "Wix",
  hosts: ["mcp.wix.com"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration.
    oauth: oauth2({ discover: url }),
    apiKey: secrets({
      label: "API key and account ID",
      fields: object({ token: string({ minLength: 1 }), accountId: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account as Account) }),
});

export default defineApp(
  { user: { accounts: { wix: wix.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wix ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account as Account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Wix",
        description: "Wix sites, business data (Stores, Bookings, CRM, CMS) and documentation through the Wix REST API.",
        icons,
      },
    ),
  }),
);
