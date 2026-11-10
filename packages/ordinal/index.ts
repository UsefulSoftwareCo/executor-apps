import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://app.tryordinal.com/mcp";

const ordinal = defineProvider({
  name: "Ordinal",
  hosts: ["app.tryordinal.com", "mletdxmpsjlbfpnymbcu.supabase.co"],
  auth: {
    // The MCP server publishes OAuth metadata with dynamic client registration; it has no API-key option.
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { ordinal: ordinal.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ordinal ?? [],
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
        title: "Ordinal",
        description: "Plan, draft, schedule and analyze social media posts, ideas, approvals, comments and analytics in Ordinal.",
        icons,
      },
    ),
  }),
);
