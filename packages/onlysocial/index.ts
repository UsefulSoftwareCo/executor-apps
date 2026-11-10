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

const url = "https://app.onlysocial.io/os/mcp";

const onlysocial = defineProvider({
  name: "OnlySocial",
  hosts: ["app.onlysocial.io"],
  auth: {
    // Personal access token from "Access Tokens" in the dashboard user menu.
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata and supports dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  async health(check) {
    const { account } = check;
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    return mcpHealth(check, { url, headers: { Authorization: `Bearer ${token}` } });
  },
});

export default defineApp(
  { user: { accounts: { onlysocial: onlysocial.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.onlysocial ?? [],
        async (account) => {
          const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
          return withApprovals(
            await mcpRouter({ url, account, headers: { Authorization: `Bearer ${token}` }, signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          );
        },
        { signal },
      ),
      {
        title: "OnlySocial",
        description: "Social media management: workspaces, connected accounts, posts, scheduling, tags and media library.",
        icons,
        instructions: "Call list-workspaces first; every other tool needs a workspace UUID.",
      },
    ),
  }),
);
