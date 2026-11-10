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

const url = "https://mcp.particl.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const particl = defineProvider({
  name: "Particl",
  hosts: ["mcp.particl.com", "clerk.particl.com"],
  auth: {
    // The MCP resource names https://mcp.particl.com as its authorization server, but that metadata
    // reports issuer https://clerk.particl.com, which standard discovery rejects. Discover from the
    // Clerk issuer directly (its metadata matches and offers dynamic client registration).
    // offline_access is explicit so a refresh token is issued.
    oauth: oauth2({ discover: "https://clerk.particl.com" }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { particl: particl.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.particl ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Particl",
        description: "Read-only market intelligence on companies, products, pricing, sales estimates and marketing activity.",
        icons,
      },
    ),
  }),
);
