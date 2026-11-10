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

const url = "https://mcp.triplewhale.com/sse";

type Account =
  | { method: "apiKey"; fields: { apiKey: string } }
  | { method: "oauth"; fields: { access_token: string } };

// API keys go in x-api-key; OAuth access tokens are bearer tokens.
const headers = (account: Account): Record<string, string> =>
  account.method === "oauth"
    ? { Authorization: `Bearer ${account.fields.access_token}` }
    : { "x-api-key": account.fields.apiKey };

const triplewhale = defineProvider({
  name: "Triple Whale",
  hosts: ["mcp.triplewhale.com"],
  auth: {
    apiKey: secrets({
      label: "API key (needs the MCP: Read scope)",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: url, scopes: ["moby:read", "offline_access"] }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { triplewhale: triplewhale.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.triplewhale ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Triple Whale",
        description: "Ecommerce metrics, attribution, ads and store analytics in Triple Whale.",
        icons,
      },
    ),
  }),
);
