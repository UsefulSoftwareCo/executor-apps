import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.api.gusto.com/anthropic";

const gusto = defineProvider({
  name: "Gusto",
  hosts: ["mcp.api.gusto.com"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration; the consent screen lets
    // the admin choose which data categories to share.
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { gusto: gusto.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gusto ?? [],
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
        title: "Gusto",
        description:
          "Employees, contractors, payrolls, pay schedules, time off and company data in Gusto payroll and HR.",
        icons,
      },
    ),
  }),
);
