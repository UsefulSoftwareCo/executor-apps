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

const url = "https://www.magicslides.app/api/mcp/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const magicslides = defineProvider({
  name: "MagicSlides",
  hosts: ["www.magicslides.app"],
  auth: {
    // The server publishes OAuth 2.1 metadata with dynamic client registration.
    oauth: oauth2({ discover: url, resource: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { magicslides: magicslides.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.magicslides ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "MagicSlides",
        description: "Create and edit presentations, docs, sheets, meeting notes and frames with MagicSlides.",
        icons,
      },
    ),
  }),
);
