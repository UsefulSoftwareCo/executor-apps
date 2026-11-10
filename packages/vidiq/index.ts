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

const url = "https://mcp.vidiq.com/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// OAuth access tokens are sent as bearer tokens (standard for the server's OAuth flow).
// UNVERIFIED: vidIQ's public docs do not state the API-key header; Authorization: Bearer is
// assumed. If API-key calls fail with 401, check the snippets at app.vidiq.com/account/settings/mcp.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const vidiq = defineProvider({
  name: "vidIQ",
  hosts: ["mcp.vidiq.com"],
  auth: {
    // Created at app.vidiq.com/account/settings/mcp. Write actions need OAuth.
    apiKey: secrets({
      label: "vidIQ MCP API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata with dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { vidiq: vidiq.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vidiq ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "vidIQ",
        description: "Research YouTube and Instagram creators, videos, keywords, trends and comments, generate titles and thumbnails, and read channel analytics in vidIQ.",
        icons,
      },
    ),
  }),
);
