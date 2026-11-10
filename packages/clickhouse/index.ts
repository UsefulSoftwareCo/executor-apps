import {
  accountRouter,
  decodeJson,
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
import { always } from "apps/operations/approval";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mcpUrl = "https://mcp.clickhouse.cloud/mcp";

const basic = (fields: { keyId: string; keySecret: string }) =>
  `Basic ${btoa(`${fields.keyId}:${fields.keySecret}`)}`;

const clickhouse = defineProvider({
  name: "ClickHouse",
  hosts: ["api.clickhouse.cloud", "mcp.clickhouse.cloud"],
  auth: {
    apiKey: secrets({
      label: "ClickHouse Cloud API key (key ID and key secret)",
      fields: object({ keyId: string({ minLength: 1 }), keySecret: string({ minLength: 1 }) }),
    }),
    // Official remote MCP server (SQL, schema exploration, service management): OAuth with
    // dynamic client registration. The server advertises mcp:access plus OIDC scopes.
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
    const response = await fetch("https://api.clickhouse.cloud/v1/organizations", {
      signal,
      headers: { Authorization: basic(account.fields) },
    });
    await decodeJson(response, object({}));
    return {};
  },
});

export default defineApp(
  { user: { accounts: { clickhouse: clickhouse.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.clickhouse ?? [],
        async (account) => {
          const approve = (tool: Parameters<typeof toolAnnotations>[0]) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always();
          if (account.method === "oauth") {
            return withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.access_token}` },
                signal,
              }),
              approve,
            );
          }
          // API key accounts get the control-plane OpenAPI tools and the MCP server (SQL).
          return router({
            api: withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
            sql: withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: basic(account.fields) },
                signal,
              }),
              approve,
            ),
          });
        },
        { signal },
      ),
      {
        title: "ClickHouse",
        description:
          "Manage ClickHouse Cloud: organizations, services, API keys, members, invitations, backups, ClickPipes, private endpoints and usage, and run read-only SQL and explore schemas through the official MCP server.",
        icons,
      },
    ),
  }),
);
