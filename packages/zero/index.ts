import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://api.zero.inc/mcp";

const zero = defineProvider({
  name: "Zero",
  hosts: ["api.zero.inc"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration; it accepts no API key.
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { zero: zero.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zero ?? [],
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
        title: "Zero",
        description: "Search and manage companies, contacts, deals, tasks, notes, lists, quotes, reports and outreach sequences in the Zero CRM.",
        icons,
        instructions: "Call get_instructions and get_workspace_metadata first in every conversation; they describe the workspace's data model, pipelines and custom properties.",
      },
    ),
  }),
);
