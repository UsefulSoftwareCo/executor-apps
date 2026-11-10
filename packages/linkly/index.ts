import {
  ProviderError,
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  router,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.linklyhq.com";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

// The hosted MCP server answers anonymous requests, so mcpHealth cannot verify an account.
// Check the token against Linkly's REST API instead (a bad token returns 401).
const linkly = defineProvider({
  name: "Linkly",
  hosts: ["mcp.linklyhq.com", "app.linklyhq.com", "api.linklyhq.com"],
  auth: {
    // The MCP server advertises dynamic client registration and one scope.
    oauth: oauth2({ discover: url }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.linklyhq.com/api/v1/workspaces", {
      signal,
      headers: headers(account),
    });
    const { status } = response;
    if (status === 401) throw new ProviderError({ reason: "unauthorized", status });
    if (status === 403) throw new ProviderError({ reason: "rejected", status });
    if (status === 429) throw new ProviderError({ reason: "rate_limited", status });
    if (status >= 500) throw new ProviderError({ reason: "unavailable", status });
    if (!response.ok) throw new ProviderError({ reason: "rejected", status });
    return {};
  },
});

export default defineApp(
  { user: { accounts: { linkly: linkly.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.linkly ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Linkly",
        description: "Short links, custom domains, webhooks and click analytics in Linkly.",
        icons,
      },
    ),
  }),
);
