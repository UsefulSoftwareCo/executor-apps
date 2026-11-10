import {
  accountRouter,
  boolean,
  decodeJson,
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
import { liveOpenapiRouter } from "apps/openapi";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mcpUrl = "https://mcp.anydb.com";

const CheckAuth = object({ success: boolean() });

const anydb = defineProvider({
  name: "AnyDB",
  hosts: ["app.anydb.com", "mcp.anydb.com"],
  auth: {
    // REST integration API: needs both headers, so the account stores the key and the user's email.
    apiKey: secrets({
      label: "Integration API key and the email of the AnyDB user it belongs to",
      fields: object({ apiKey: string({ minLength: 1 }), email: string({ minLength: 1 }) }),
    }),
    // Official hosted MCP server (56 tools): OAuth with dynamic client registration and PKCE S256.
    // Scopes are left to the server's metadata (mcp:read, mcp:write, mcp:author).
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, {
        url: mcpUrl,
        headers: { Authorization: `Bearer ${account.fields.access_token}` },
      });
    }
    const response = await fetch("https://app.anydb.com/api/integrations/ext/checkauth", {
      method: "POST",
      signal,
      headers: { "x-anydb-api-key": account.fields.apiKey, "x-anydb-email": account.fields.email },
    });
    if (!response.ok) throw new Error(`AnyDB rejected the credentials (${response.status})`);
    const body = await decodeJson(response, CheckAuth);
    if (!body.success) throw new Error("AnyDB rejected the credentials");
    return {};
  },
});

export default defineApp(
  { user: { accounts: { anydb: anydb.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.anydb ?? [],
        async (account) => {
          if (account.method === "oauth") {
            return withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            );
          }
          return withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          );
        },
        { signal },
      ),
      {
        title: "AnyDB",
        description:
          "Work with AnyDB teams, databases and records: list, search, create, update, copy, remove, share, upload and download files, and manage webhooks. OAuth accounts also get workspaces, types, views, reports and workflows.",
        icons,
      },
    ),
  }),
);
