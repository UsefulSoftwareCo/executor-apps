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

// Full configuration of Postman's US remote MCP server (every Postman API tool).
const url = "https://mcp.postman.com/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const postman = defineProvider({
  name: "Postman",
  hosts: ["mcp.postman.com"],
  auth: {
    // Postman API key (PMAK-...), sent as a bearer token.
    apiKey: secrets({
      label: "Postman API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server publishes OAuth metadata with dynamic client registration and PKCE S256.
    oauth: oauth2({ discover: url }),
  },
  health: (check) => mcpHealth(check, { url, headers: headers(check.account as Account) }),
});

export default defineApp(
  { user: { accounts: { postman: postman.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.postman ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account as Account), cache, signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Postman",
        description:
          "Postman workspaces, collections, environments, API specs, mock servers, monitors, tags and client code generation.",
        icons,
      },
    ),
  }),
);
