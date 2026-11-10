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

const url = "https://mcp.devolens.com/mcp";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Access tokens go in a `token` header; OAuth access tokens are sent as bearer tokens.
const headers = (account: Account): Record<string, string> =>
  account.method === "oauth"
    ? { Authorization: `Bearer ${account.fields.access_token}` }
    : { token: account.fields.token };

const devolens = defineProvider({
  name: "Devolens",
  hosts: ["mcp.devolens.com", "cryptolensab.eu.scalekit.com"],
  auth: {
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server advertises dynamic client registration; the user picks permissions when authorizing.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { devolens: devolens.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.devolens ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Devolens",
        description: "Products, license keys, customers and usage analytics in Devolens (formerly Cryptolens).",
        icons,
      },
    ),
  }),
);
