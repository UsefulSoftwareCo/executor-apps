import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const mcpUrl = "https://api.serply.io/mcp";

const serply = defineProvider({
  name: "Serply",
  hosts: ["api.serply.io"],
  auth: {
    // The same key works for the REST API and the MCP server, sent in the X-Api-Key header.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url: mcpUrl, headers: { "X-Api-Key": check.account.fields.token } }),
});

export default defineApp(
  { user: { accounts: { serply: serply.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.serply ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({ url: mcpUrl, account, headers: { "X-Api-Key": account.fields.token }, signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Serply",
        description:
          "Search live Google, Bing, News, Scholar, Video, Jobs, Maps, Amazon and Reddit results and scrape any page as markdown with Serply.",
        icons,
      },
    ),
  }),
);
