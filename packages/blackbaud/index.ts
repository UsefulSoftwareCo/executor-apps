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

const url = "https://mcp.sky.blackbaud.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const blackbaud = defineProvider({
  name: "Blackbaud",
  hosts: ["mcp.sky.blackbaud.com"],
  auth: {
    // The server's protected-resource metadata names a relative authorization server and Blackbaud's OAuth server
    // offers no dynamic client registration, so the endpoints are declared and the connect page asks for the
    // client of a SKY developer application.
    oauth: oauth2({
      authorizationUrl: "https://app.blackbaud.com/oauth/authorize",
      tokenUrl: "https://oauth2.sky.blackbaud.com/token",
      // Blackbaud metadata omits token_endpoint_auth_methods_supported, so this is the RFC 8414 default.
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["mcp:tools"],
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { blackbaud: blackbaud.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.blackbaud ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Blackbaud",
        description: "Raiser's Edge NXT constituents, gifts, events and donor data.",
        icons,
      },
    ),
  }),
);
