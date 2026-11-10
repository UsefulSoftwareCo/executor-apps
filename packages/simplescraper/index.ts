import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.simplescraper.io/mcp";

const simplescraper = defineProvider({
  name: "Simplescraper",
  hosts: ["mcp.simplescraper.io"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration (PKCE S256); it has no API-key option.
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { simplescraper: simplescraper.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.simplescraper ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({
              url,
              account,
              headers: { Authorization: `Bearer ${account.fields.access_token}` },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Simplescraper",
        description: "Scrape websites, create and manage scraping recipes and extract structured live web data in Simplescraper.",
        icons,
      },
    ),
  }),
);
