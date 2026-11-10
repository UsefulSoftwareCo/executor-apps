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

const url = "https://mcp.surecontact.com/start";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// API keys go in X-API-Key (as in the REST API); OAuth access tokens are bearer tokens.
const headers = (account: Account): Record<string, string> =>
  account.method === "oauth"
    ? { Authorization: `Bearer ${account.fields.access_token}` }
    : { "X-API-Key": account.fields.token };

const surecontact = defineProvider({
  name: "SureContact",
  hosts: ["mcp.surecontact.com"],
  auth: {
    token: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata with dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { surecontact: surecontact.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.surecontact ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "SureContact",
        description: "Manage SureContact contacts, lists, tags, campaigns, sequences, forms and reports.",
        icons,
      },
    ),
  }),
);
