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
import { graphqlRouter } from "apps/graphql";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const graphqlUrl = "https://api.linear.app/graphql";
// Linear's official remote MCP server. It registers clients itself (dynamic client registration and
// Client ID Metadata Documents), so signing in needs no OAuth app of the user's own.
const mcpUrl = "https://mcp.linear.app/mcp";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "apiKey"; fields: { token: string } };

const linear = defineProvider({
  name: "Linear",
  hosts: ["mcp.linear.app", "api.linear.app"],
  auth: {
    // First, so the connect page starts with it. Its tokens are the MCP server's own.
    oauth: oauth2({ discover: mcpUrl }),
    apiKey: secrets({
      label: "Personal API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health(check) {
    if (check.account.method === "oauth") return mcpHealth(check, { url: mcpUrl, headers: mcpHeaders(check.account) });
    const response = await check.fetch(graphqlUrl, {
      method: "POST",
      signal: check.signal,
      headers: { Authorization: check.account.fields.token, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ viewer { id name email } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ viewer: object({ id: string(), name: string(), email: string() }) }) }),
    );
    return { accountInfo: { externalId: data.viewer.id, displayName: data.viewer.name, email: data.viewer.email } };
  },
});

// The MCP server takes either credential as a bearer token. GraphQL takes a personal API key as it is.
const mcpHeaders = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

export default defineApp(
  { user: { accounts: { linear: linear.many() } }, icons },
  async ({ user, cache, signal }) => {
    const accounts = user?.accounts.linear ?? [];
    return {
      tools: router(
        {
          mcp: router(
            await accountRouter(
              accounts,
              async (account) =>
                withApprovals(
                  await mcpRouter({ url: mcpUrl, account, headers: mcpHeaders(account), cache, signal }),
                  (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
                ),
              { signal },
            ),
            {
              title: "Linear MCP",
              description: "Linear's MCP server: issues, projects, cycles, teams, comments and documents.",
            },
          ),
          // MCP sign-in tokens only work on the MCP server, so the GraphQL API serves API-key accounts.
          api: router(
            await accountRouter(
              accounts.flatMap((account) => (account.method === "apiKey" ? [account] : [])),
              async (account) =>
                withApprovals(
                  await graphqlRouter({
                    url: graphqlUrl,
                    account,
                    headers: { Authorization: account.fields.token },
                    cache,
                    signal,
                  }),
                  (tool) => (tool.kind === "mutation" ? always() : undefined),
                ),
              { signal },
            ),
            {
              title: "Linear API",
              description: "The rest of Linear's GraphQL API, for accounts connected with a personal API key.",
            },
          ),
        },
        {
          title: "Linear",
          description:
            "Issues, projects, cycles, teams, comments and documents through Linear's MCP server (mcp), plus Linear's full GraphQL API for API-key accounts (api).",
          instructions:
            "Use the mcp tools first. The api tools exist only for accounts connected with a personal API key.",
          icons,
        },
      ),
    };
  },
);
