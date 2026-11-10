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

const url = "https://mcp.scrollstash.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const scrollstash = defineProvider({
  name: "ScrollStash",
  hosts: ["mcp.scrollstash.com"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration.
    // Pin the RFC 8707 resource to the canonical value from the protected-resource metadata.
    oauth: oauth2({ discover: url, resource: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { scrollstash: scrollstash.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.scrollstash ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "ScrollStash",
        description: "Competitor ad intelligence over the Meta Ad Library: brands, observed ads and landing pages.",
        icons,
      },
    ),
  }),
);
