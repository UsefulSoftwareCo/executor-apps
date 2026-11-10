import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.magicpatterns.com/mcp";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "apiKey"; fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const magicPatterns = defineProvider({
  name: "Magic Patterns",
  hosts: ["mcp.magicpatterns.com", "oauth.magicpatterns.com"],
  auth: {
    // Settings > API Keys; the vendor requires a paid plan.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata with dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { magicPatterns: magicPatterns.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.magicPatterns ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Magic Patterns",
        description: "Magic Patterns AI interface design: create and iterate on designs, inspect status and history, read and edit artifact files, and publish designs.",
        icons,
      },
    ),
  }),
);
