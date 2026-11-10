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

const url = "https://mcp.scavio.dev/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// API keys go in the x-api-key header; OAuth access tokens are bearer tokens.
const headers = (account: Account): Record<string, string> =>
  account.method === "oauth"
    ? { Authorization: `Bearer ${account.fields.access_token}` }
    : { "x-api-key": account.fields.token };

const scavio = defineProvider({
  name: "Scavio",
  hosts: ["mcp.scavio.dev"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Scavio advertises dynamic client registration for its MCP server.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { scavio: scavio.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.scavio ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Scavio",
        description:
          "Real-time search and structured data for agents: Google, YouTube, TikTok, Instagram, X, retail, travel, jobs and more, plus URL extraction.",
        icons,
      },
    ),
  }),
);
