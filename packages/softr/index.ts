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
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const mcpUrl = "https://mcp.softr.io/mcp";

const softr = defineProvider({
  name: "Softr",
  hosts: ["tables-api.softr.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://tables-api.softr.io/api/v1/databases", {
      signal,
      headers: { "Softr-Api-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

type McpAccount =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Personal access tokens and OAuth access tokens are both sent as bearer tokens.
const mcpHeaders = (account: McpAccount) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const softrMcp = defineProvider({
  name: "Softr MCP",
  hosts: ["mcp.softr.io", "studio-api.softr.io"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Softr does not support dynamic client registration; the OAuth app needs a pre-registered client ID.
    oauth: oauth2({
      discover: "https://studio-api.softr.io",
      scopes: [
        "applications:read",
        "applications:write",
        "databases.records:read",
        "databases.records:write",
        "databases.schema:write",
        "workflows:read",
        "workflows:write",
        "workflows:execute",
      ],
    }),
  },
  health: (check) => mcpHealth(check, { url: mcpUrl, headers: mcpHeaders(check.account) }),
});

export default defineApp(
  { user: { accounts: { softr: softr.many(), softrMcp: softrMcp.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        database: await accountRouter(
          user?.accounts.softr ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        mcp: await accountRouter(
          user?.accounts.softrMcp ?? [],
          async (account) =>
            withApprovals(
              await mcpRouter({ url: mcpUrl, account, headers: mcpHeaders(account), cache, signal }),
              (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
            ),
          { signal },
        ),
      },
      {
        title: "Softr",
        description:
          "Softr. database: Database API for databases, tables, fields and records (API key). mcp: Softr's hosted MCP server for databases, apps, pages, blocks, workflows and app users (personal access token or OAuth).",
        icons,
      },
    ),
  }),
);
