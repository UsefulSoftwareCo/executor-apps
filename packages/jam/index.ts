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

const url = "https://mcp.jam.dev/mcp";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Personal access tokens (jam_pat_...) and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const jam = defineProvider({
  name: "Jam",
  hosts: ["mcp.jam.dev", "api.jam.dev"],
  auth: {
    // Created at Settings > MCP > Personal Access Tokens, with mcp:read and/or mcp:write scopes.
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata with dynamic client registration (scopes mcp:read, mcp:write).
    oauth: oauth2({ discover: url }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: headers(check.account) }),
});

export default defineApp(
  { user: { accounts: { jam: jam.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jam ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({
              url,
              account,
              headers: headers(account),
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Jam",
        description: "Read and manage Jam bug reports: recordings, console logs, network requests, device context and comments.",
        icons,
      },
    ),
  }),
);
