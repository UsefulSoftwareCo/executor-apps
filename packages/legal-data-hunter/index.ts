import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://legaldatahunter.com/mcp";

const legalDataHunter = defineProvider({
  name: "Legal Data Hunter",
  hosts: ["legaldatahunter.com"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration (scope "mcp").
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { legalDataHunter: legalDataHunter.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.legalDataHunter ?? [],
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
        title: "Legal Data Hunter",
        description: "Search and read court decisions, legislation and doctrine across 230+ jurisdictions in Legal Data Hunter.",
        icons,
      },
    ),
  }),
);
