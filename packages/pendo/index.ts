import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://app.pendo.io/mcp/v0/shttp";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "serviceAccount"; fields: { access_token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.access_token}`,
});

const pendo = defineProvider({
  name: "Pendo",
  hosts: ["app.pendo.io"],
  auth: {
    // The server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: url }),
    // Service account (Settings > Integrations > Service accounts): client credentials, form body, scope read:me.
    serviceAccount: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://app.pendo.io/oauth/v1/token",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: ["read:me"],
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { pendo: pendo.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pendo ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Pendo",
        description: "Product analytics, in-app guides and customer feedback in Pendo.",
        icons,
      },
    ),
  }),
);
