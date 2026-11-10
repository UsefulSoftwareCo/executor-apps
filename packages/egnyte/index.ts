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

const url = "https://mcp-server.egnyte.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const egnyte = defineProvider({
  name: "Egnyte",
  hosts: ["mcp-server.egnyte.com", "mcp-oauth.egnyte.com"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration (works for any tenant).
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { egnyte: egnyte.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.egnyte ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Egnyte",
        description: "Egnyte files, folders, search, links, comments, projects, workflows and Copilot answers.",
        icons,
      },
    ),
  }),
);
