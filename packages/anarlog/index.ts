import { accountRouter, defineApp, defineProvider, oauth2, router, toolAnnotations, withApprovals } from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://api.anarlog.so/mcp";
const headers = (token: string) => ({
  Accept: "application/json,text/event-stream",
  Authorization: `Bearer ${token}`,
});

const anarlog = defineProvider({
  name: "Anarlog",
  hosts: ["api.anarlog.so", "ijoptyyjrfqwaqhyxkxj.supabase.co"],
  auth: {
    // The server publishes OAuth protected-resource metadata and supports dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account.fields.access_token) }),
});

export default defineApp(
  { user: { accounts: { anarlog: anarlog.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.anarlog ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({ url, account, headers: headers(account.fields.access_token), signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Anarlog",
        description: "Search and read your Anarlog meetings, notes and transcripts.",
        icons,
      },
    ),
  }),
);
