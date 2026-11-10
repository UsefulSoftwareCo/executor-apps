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

const url = "https://mcp.zapier.com/api/v1/connect";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Connection tokens and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const zapier = defineProvider({
  name: "zapier",
  hosts: ["mcp.zapier.com"],
  auth: {
    // Long-lived token created for one server at mcp.zapier.com.
    token: secrets({
      label: "Connection token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { zapier: zapier.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zapier ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Zapier",
        description: "Run the actions you configure in Zapier MCP across thousands of connected apps.",
        icons,
      },
    ),
  }),
);
