import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  router,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.gorgias.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const gorgias = defineProvider({
  name: "Gorgias",
  hosts: ["mcp.gorgias.com"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration.
    oauth: oauth2({
      discover: url,
      // "offline" yields the refresh token. Admin-like scopes (billing:read,
      // integrations:write, users:write, account:write) are omitted.
      scopes: [
        "openid", "email", "profile", "offline",
        "account:read", "users:read", "customers:read", "customers:write", "segments:read",
        "tickets:read", "tickets:write", "custom_fields:read", "custom_fields:write",
        "events:read", "integrations:read", "service_connection:read",
        "jobs:read", "jobs:write", "macros:read", "macros:write",
        "rules:read", "rules:write", "routines:read", "routines:write",
        "satisfaction_survey:read", "satisfaction_survey:write", "statistics:read",
        "tags:read", "tags:write", "apps:read", "apps:write",
        "help_center:read", "help_center:write", "ecommerce:read", "ecommerce:write",
      ],
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { gorgias: gorgias.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gorgias ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Gorgias",
        description:
          "Gorgias helpdesk: tickets, customers, macros, rules, views, help center, AI Agent setup and reporting.",
        instructions: "Call get_gaia_instructions first; it returns the server's operating manual.",
        icons,
      },
    ),
  }),
);
