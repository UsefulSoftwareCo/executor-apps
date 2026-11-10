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

const url = "https://mcp.brightdata.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const brightdata = defineProvider({
  name: "Bright Data",
  hosts: ["mcp.brightdata.com", "brightdata.com"],
  auth: {
    // The server publishes OAuth metadata (issuer brightdata.com) with dynamic client registration.
    // Its metadata lists token_endpoint_auth_methods_supported ["none"], so the client is public (PKCE).
    oauth: oauth2({ discover: url, tokenEndpointAuthMethod: "none" }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { brightdata: brightdata.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.brightdata ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Bright Data",
        description:
          "Search the web, scrape pages through Web Unlocker, drive a scraping browser and pull structured data from pre-built scrapers.",
        icons,
      },
    ),
  }),
);
