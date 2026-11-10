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

const url = "https://mcp.workable.com/mcp";

const headers = (account: { fields: { access_token: string } }) => ({
  Authorization: `Bearer ${account.fields.access_token}`,
});

const workable = defineProvider({
  name: "Workable",
  hosts: ["mcp.workable.com"],
  auth: {
    // Workable's MCP server supports dynamic client registration (PKCE S256).
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { workable: workable.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.workable ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Workable",
        description:
          "Workable recruiting and HR: jobs, candidates, offers, requisitions, members, employees, time off, time tracking and performance reviews.",
        instructions:
          "Call get_accounts first and pass the chosen account's subdomain as the account parameter on every other tool.",
        icons,
      },
    ),
  }),
);
