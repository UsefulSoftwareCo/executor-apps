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

const url = "https://mcp.anakin.io/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const anakin = defineProvider({
  name: "Anakin",
  hosts: ["mcp.anakin.io", "anakin.io"],
  auth: {
    // The server publishes OAuth metadata (authorization server anakin.io) with dynamic client registration.
    oauth: oauth2({ discover: url, scopes: ["openid", "offline_access", "anakin:tools"] }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { anakin: anakin.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.anakin ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Anakin",
        description:
          "Web data for agents: scrape, search, map and crawl pages, run agentic research and Wire site actions, set up monitors, and compare AI answer engines.",
        icons,
      },
    ),
  }),
);
