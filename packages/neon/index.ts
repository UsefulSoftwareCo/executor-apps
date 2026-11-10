import {
  accountRouter,
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
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const neon = defineProvider({
  name: "Neon",
  hosts: ["console.neon.tech"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /users/me needs a personal or organization key; project-scoped keys cannot call account-level endpoints.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://console.neon.tech/api/v2/users/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ id: string({ minLength: 1 }) }));
  },
});

const mcpUrl = "https://mcp.neon.tech/mcp";

type McpAccount =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Neon API keys and OAuth access tokens are both sent as bearer tokens.
const mcpHeaders = (account: McpAccount) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

// Neon's MCP server adds SQL execution, migrations and query tuning. It has its own OAuth
// (dynamic client registration) whose tokens only work against mcp.neon.tech.
const neonMcp = defineProvider({
  name: "Neon MCP",
  hosts: ["mcp.neon.tech"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({ discover: mcpUrl }),
  },
  health: (check) => mcpHealth(check, { url: mcpUrl, headers: mcpHeaders(check.account) }),
});

export default defineApp(
  { user: { accounts: { neon: neon.many(), neonMcp: neonMcp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: router(
          await accountRouter(
            user?.accounts.neon ?? [],
            (account) =>
              withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                tool.kind === "mutation" ? always() : undefined,
              ),
            { signal },
          ),
          {
            title: "Neon API",
            description:
              "Neon management REST API: projects, branches, endpoints, databases, roles, operations and organizations.",
          },
        ),
        mcp: router(
          await accountRouter(
            user?.accounts.neonMcp ?? [],
            async (account) =>
              withApprovals(
                await mcpRouter({ url: mcpUrl, account, headers: mcpHeaders(account), signal }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
            { signal },
          ),
          {
            title: "Neon MCP",
            description:
              "Neon's remote MCP server: run SQL and transactions, inspect and migrate schemas, compare branches and tune slow queries.",
          },
        ),
      },
      {
        title: "Neon",
        description:
          "Manage Neon serverless Postgres: projects, branches, endpoints, databases, roles, operations and organizations (api), plus SQL execution, migrations and query tuning through Neon's MCP server (mcp).",
        icons,
      },
    ),
  }),
);
