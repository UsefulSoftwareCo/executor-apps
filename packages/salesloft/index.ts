import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.salesloft.com/mcp";

const salesloft = defineProvider({
  name: "Salesloft",
  hosts: ["mcp.salesloft.com", "accounts.salesloft.com"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration (PKCE S256).
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { salesloft: salesloft.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.salesloft ?? [],
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
        title: "Salesloft",
        description: "People, accounts, cadences, calls, emails and meetings in the Salesloft sales engagement platform.",
        icons,
      },
    ),
  }),
);
