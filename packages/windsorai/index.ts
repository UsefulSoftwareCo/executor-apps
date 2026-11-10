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

const url = "https://mcp.windsor.ai/";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// A Windsor API key and an OAuth access token are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const windsor = defineProvider({
  name: "Windsor.ai",
  hosts: ["mcp.windsor.ai"],
  auth: {
    token: secrets({
      label: "Windsor.ai API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Windsor advertises dynamic client registration and these scopes in its metadata.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { windsor: windsor.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.windsor ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Windsor.ai",
        description: "Query marketing, advertising, analytics and CRM data connected to a Windsor.ai account.",
        icons,
      },
    ),
  }),
);
