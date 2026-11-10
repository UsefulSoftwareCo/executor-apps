import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  oauth2,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.opengraph.io/mcp";

type Account =
  | { method: "apiKey"; fields: { appId: string } }
  | { method: "oauth"; fields: { access_token: string } };

// The App ID goes in the x-app-id header; an OAuth access token is a bearer token.
const headers = (account: Account): Record<string, string> =>
  account.method === "oauth"
    ? { Authorization: `Bearer ${account.fields.access_token}` }
    : { "x-app-id": account.fields.appId };

const opengraphio = defineProvider({
  name: "OpenGraph.io",
  hosts: ["mcp.opengraph.io"],
  auth: {
    apiKey: secrets({
      label: "App ID",
      fields: object({ appId: string({ minLength: 1 }) }),
    }),
    // The server publishes protected-resource metadata pointing at dashboard-api.opengraph.io,
    // which supports dynamic client registration with PKCE.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { opengraphio: opengraphio.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.opengraphio ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "OpenGraph.io",
        description: "Unfurl links, scrape pages, take screenshots, extract data and ask questions about web pages with OpenGraph.io.",
        icons,
      },
    ),
  }),
);
