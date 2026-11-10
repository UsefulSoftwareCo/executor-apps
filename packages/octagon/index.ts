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

const url = "https://mcp.octagonai.co/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const octagon = defineProvider({
  name: "Octagon",
  hosts: ["mcp.octagonai.co", "login.octagonai.co"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration.
    // Pin the RFC 8707 resource to the canonical value from the protected-resource metadata.
    oauth: oauth2({ discover: url, resource: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { octagon: octagon.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.octagon ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Octagon",
        description: "Public and private market intelligence from Octagon: SEC filings, earnings transcripts, financial metrics, stock data, deep research and prediction-market analysis.",
        icons,
      },
    ),
  }),
);
