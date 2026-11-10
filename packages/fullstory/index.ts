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

const url = "https://api.fullstory.com/mcp/fullstory";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Fullstory API keys and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const fullstory = defineProvider({
  name: "Fullstory",
  hosts: ["api.fullstory.com", "auth.fullstory.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The MCP server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { fullstory: fullstory.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fullstory ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Fullstory",
        description: "Search sessions and users, read metrics, funnels and playback data from Fullstory.",
        icons,
      },
    ),
  }),
);
