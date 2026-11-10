import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.inistate.com/mcp";

const inistate = defineProvider({
  name: "Inistate",
  hosts: ["mcp.inistate.com"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration; it has no API-key option.
    oauth: oauth2({
      discover: url,
      scopes: [
        "data.entries:read",
        "data.entries:write",
        "data.files:read",
        "data.files:write",
        "schema.modules:read",
        "schema.modules:write",
        "user:read",
      ],
    }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { inistate: inistate.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.inistate ?? [],
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
        title: "Inistate",
        description: "Query and change Inistate workflow modules, entries, activities, history and files.",
        icons,
      },
    ),
  }),
);
