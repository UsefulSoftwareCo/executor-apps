import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.tickettailor.ai/mcp";

const tickettailor = defineProvider({
  name: "Ticket Tailor",
  hosts: ["mcp.tickettailor.ai"],
  auth: {
    // The authorization server publishes RFC 8414 metadata and dynamic client registration.
    oauth: oauth2({ discover: "https://mcp.tickettailor.ai", scopes: ["mcp.access"] }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { tickettailor: tickettailor.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tickettailor ?? [],
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
        title: "Ticket Tailor",
        description: "Manage Ticket Tailor events, ticket types, orders, discounts, products, check-ins, memberships and reports for a box office.",
        icons,
      },
    ),
  }),
);
