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

const url = "https://fire.chilipiper.com/api/fire-edge/v1/org/mcp";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// API access tokens and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const chiliPiper = defineProvider({
  name: "Chili Piper",
  hosts: ["fire.chilipiper.com"],
  auth: {
    token: secrets({
      label: "API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Chili Piper advertises dynamic client registration for its MCP server.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { chiliPiper: chiliPiper.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.chiliPiper ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Chili Piper",
        description: "Meeting routing, scheduling, distributions, users and meetings in Chili Piper.",
        icons,
      },
    ),
  }),
);
