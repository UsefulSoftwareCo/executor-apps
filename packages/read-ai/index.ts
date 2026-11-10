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

const url = "https://api.read.ai/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const readAi = defineProvider({
  name: "Read AI",
  hosts: ["api.read.ai"],
  auth: {
    // Protected-resource metadata points at authn.read.ai, which supports dynamic client registration.
    oauth: oauth2({ discover: url, scopes: ["openid", "offline_access", "mcp:execute", "meeting:read"] }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { readAi: readAi.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.readAi ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Read AI",
        description: "Meeting transcripts, summaries, action items, topics, metrics and recordings in Read AI.",
        icons,
      },
    ),
  }),
);
