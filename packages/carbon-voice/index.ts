import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.carbonvoice.app";

const carbonVoice = defineProvider({
  name: "Carbon Voice",
  hosts: ["mcp.carbonvoice.app", "api.carbonvoice.app"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration; it has no API-key option.
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.access_token}` } }),
});

export default defineApp(
  { user: { accounts: { carbonVoice: carbonVoice.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.carbonVoice ?? [],
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
        title: "Carbon Voice",
        description: "Read and send voice messages, browse conversations and channels, and manage collaboration in Carbon Voice.",
        icons,
      },
    ),
  }),
);
