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

const url = "https://api.raindrop.io/rest/v2/ai/mcp";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "token"; fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const raindrop = defineProvider({
  name: "Raindrop.io",
  hosts: ["api.raindrop.io"],
  auth: {
    // The server publishes OAuth metadata and advertises a registration endpoint, but that
    // endpoint only accepts pre-registered clients (it answers "Only pre-registered clients
    // are allowed to use DCR"). The first connect therefore falls back to the host's client
    // form, where the user enters the Client ID and Secret of an app they created in Raindrop.
    // Scopes and resource match the vendor's protected-resource metadata
    // (https://api.raindrop.io/.well-known/oauth-protected-resource).
    oauth: oauth2({
      discover: url,
      resource: "https://api.raindrop.io/rest/v2",
    }),
    token: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { raindrop: raindrop.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.raindrop ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Raindrop.io",
        description: "Search, save and organize Raindrop.io bookmarks, collections, tags and highlights.",
        icons,
      },
    ),
  }),
);
