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

const mcpUrl = "https://mcp.dartai.com/mcp";

const dart = defineProvider({
  name: "Dart",
  hosts: ["mcp.dartai.com"],
  auth: {
    // Personal or agent token, sent as a bearer token.
    apiKey: secrets({
      label: "Dart token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Official hosted MCP server: OAuth with dynamic client registration and PKCE S256 (scopes read, write).
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    return mcpHealth(check, { url: mcpUrl, headers: authorization(check.account) });
  },
});

function authorization(
  account: { method: "apiKey"; fields: { token: string } } | { method: "oauth"; fields: { access_token: string } },
) {
  return {
    Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
  };
}

export default defineApp(
  { user: { accounts: { dart: dart.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dart ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url: mcpUrl, account, headers: authorization(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Dart",
        description: "Tasks, docs, comments and workspace configuration in Dart, the AI project management tool.",
        icons,
      },
    ),
  }),
);
