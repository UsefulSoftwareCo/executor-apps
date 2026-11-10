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

const url = "https://agent.thoughtspot.app/mcp?api-version=latest";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const thoughtspot = defineProvider({
  name: "ThoughtSpot",
  hosts: ["agent.thoughtspot.app"],
  auth: {
    // The Spotter MCP gateway publishes RFC 8414 metadata and dynamic client registration.
    oauth: oauth2({ discover: "https://agent.thoughtspot.app" }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { thoughtspot: thoughtspot.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.thoughtspot ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "ThoughtSpot",
        description: "Ask governed analytics questions, run deep research and get insights from ThoughtSpot Spotter.",
        icons,
      },
    ),
  }),
);
