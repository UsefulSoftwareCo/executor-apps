import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.lovable.dev";

const lovable = defineProvider({
  name: "Lovable",
  hosts: ["mcp.lovable.dev"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration; it has no API-key option.
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { lovable: lovable.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lovable ?? [],
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
        title: "Lovable",
        description: "List and create Lovable projects, send messages to the Lovable agent, read code, query the database, deploy and view analytics.",
        icons,
      },
    ),
  }),
);
