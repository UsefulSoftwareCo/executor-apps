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

const url = "https://public-api.wordpress.com/wpcom/v2/mcp/v1";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const wordpress = defineProvider({
  name: "WordPress.com",
  hosts: ["public-api.wordpress.com"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration.
    // WordPress.com's custom MCP client guide authorizes with scope=auth only;
    // tool access (full vs read-only) is chosen on the consent screen, so the
    // broad "global" scope advertised in the metadata is deliberately not requested.
    oauth: oauth2({ discover: url, scopes: ["auth"] }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { wordpress: wordpress.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wordpress ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "WordPress.com",
        description: "Manage WordPress.com and Jetpack-connected sites, posts, pages, media, comments and stats through the official WordPress.com MCP server.",
        icons,
      },
    ),
  }),
);
