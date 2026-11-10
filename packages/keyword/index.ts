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

const url = "https://app.keyword.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

// The server publishes OAuth metadata with dynamic client registration. The protected
// resource lists four scopes, but the authorization server also advertises
// write:keywords and write:alerts, which keyword and alert write tools may need, so
// request the full set the authorization server supports.
const keyword = defineProvider({
  name: "Keyword.com",
  hosts: ["app.keyword.com"],
  auth: {
    oauth: oauth2({
      discover: url,
      scopes: ["read:schema", "read:data", "write:data", "write:keywords", "write:exports", "write:alerts"],
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { keyword: keyword.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.keyword ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), cache, signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Keyword.com",
        description:
          "Keyword.com rank tracking and AI visibility: projects, keywords, rankings, share of voice, alerts and AI search visibility.",
        icons,
      },
    ),
  }),
);
