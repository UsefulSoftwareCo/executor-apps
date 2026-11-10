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

const url = "https://mcp.leadiq.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const leadiq = defineProvider({
  name: "LeadIQ",
  // The Auth0 tenant is the OAuth authorization server; token exchange and refresh send credentials to it.
  hosts: ["mcp.leadiq.com", "leadiq-mcp-prod.us.auth0.com"],
  auth: {
    // Auth0-backed OAuth metadata with dynamic client registration (scopes leadiq:api, offline_access).
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { leadiq: leadiq.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.leadiq ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "LeadIQ",
        description: "B2B prospecting: find and enrich people and companies, verify emails, manage lists and check credits.",
        icons,
      },
    ),
  }),
);
