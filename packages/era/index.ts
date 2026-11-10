import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://context.era.app/mcp";

const era = defineProvider({
  name: "Era",
  hosts: ["context.era.app"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration; it has no API-key option.
    oauth: oauth2({
      discover: url,
      scopes: [
        "mcp:discovery",
        "mcp:tools-basic",
        "mcp:tools-write",
        "mcp:resources-read",
        "mcp:content-write",
        "markets:read",
        "content:read",
        "offline_access",
      ],
    }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { era: era.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.era ?? [],
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
        title: "Era",
        description: "Analyze personal finances in Era: linked accounts, balances, transactions, financial context, connections and billing.",
        icons,
      },
    ),
  }),
);
