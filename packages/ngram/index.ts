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

const url = "https://mcp.ngram.com";

type Account =
  | { method: "apiKey"; fields: { apiKey: string } }
  | { method: "oauth"; fields: { access_token: string } };

// API keys and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.apiKey}`,
});

const ngram = defineProvider({
  name: "ngram",
  hosts: ["mcp.ngram.com", "dwklztaldfwaufscnqbw.supabase.co"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata with dynamic client registration (Supabase auth).
    // The MCP resource advertises only openid/email/profile; the Supabase authorization server
    // advertises offline_access and the refresh_token grant. Request it explicitly so the
    // short-lived access token can be refreshed.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { ngram: ngram.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ngram ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "ngram",
        description: "Create AI videos and images, track render jobs and manage your ngram account.",
        icons,
      },
    ),
  }),
);
