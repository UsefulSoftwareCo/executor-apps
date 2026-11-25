import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Highseat's official remote MCP server. The authorization server lives on the app origin.
const url = "https://mcp.highseat.com/mcp";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "apiKey"; fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "apiKey" ? account.fields.token : account.fields.access_token}`,
});

const highseat = defineProvider({
  name: "Highseat",
  hosts: ["mcp.highseat.com", "app.highseat.com"],
  auth: {
    // The server advertises dynamic client registration, Client ID Metadata Documents, S256 PKCE
    // and the token endpoint auth method none, so Executor's client is a public PKCE client.
    // The resource advertises `read`; the authorization server adds `offline_access`, which
    // Highseat needs before it issues a refresh token.
    oauth: oauth2({ discover: url, scopes: ["read", "offline_access"], tokenEndpointAuthMethod: "none" }),
    apiKey: secrets({
      label: "API key",
      guide: `
        Create a key in Highseat under Workspace settings > API keys, limited to the sites the agent
        should reach. A read key lists only the tools that read; a write key adds the tools that
        change data.
      `,
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { highseat: highseat.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.highseat ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Highseat",
        description:
          "Website traffic from Highseat: visitors, pages, sources, devices, locations, campaigns, events, goals, funnels and revenue, plus a site's notes, goals, funnels, saved reports and settings.",
        icons,
      },
    ),
  }),
);
