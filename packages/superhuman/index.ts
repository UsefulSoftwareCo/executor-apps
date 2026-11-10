import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.mail.superhuman.com/mcp";

const superhuman = defineProvider({
  name: "Superhuman",
  hosts: ["mcp.mail.superhuman.com", "mcp.auth.mail.superhuman.com"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration; it has no API-key option.
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { superhuman: superhuman.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.superhuman ?? [],
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
        title: "Superhuman",
        description: "Search, read and draft email and manage calendar events in Superhuman Mail.",
        icons,
      },
    ),
  }),
);
