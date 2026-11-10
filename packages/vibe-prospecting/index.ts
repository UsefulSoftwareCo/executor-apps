import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://vibeprospecting.explorium.ai/mcp";

const vibeprospecting = defineProvider({
  name: "Vibe Prospecting",
  hosts: ["vibeprospecting.explorium.ai"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration; the OAuth metadata advertises no API-key option.
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { vibeprospecting: vibeprospecting.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vibeprospecting ?? [],
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
        title: "Vibe Prospecting",
        description: "Find, sample, enrich and export businesses and prospects with Explorium B2B data in Vibe Prospecting.",
        icons,
      },
    ),
  }),
);
