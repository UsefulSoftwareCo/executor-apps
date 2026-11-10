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

const graphqlUrl = "https://graphql.useanvil.com";
const mcpUrl = "https://mcp.useanvil.com";

const anvil = defineProvider({
  name: "Anvil",
  hosts: ["graphql.useanvil.com", "app.useanvil.com", "mcp.useanvil.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
    // The official MCP server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: mcpUrl }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url: mcpUrl, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch(graphqlUrl, {
      method: "POST",
      signal,
      headers: { Authorization: basic(account.fields.apiKey), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ currentUser { eid } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ currentUser: object({ eid: string() }) }) }),
    );
    return { accountInfo: { externalId: data.currentUser.eid, displayName: data.currentUser.eid } };
  },
});

// HTTP Basic with the API key as the username and an empty password.
function basic(apiKey: string) {
  return `Basic ${btoa(`${apiKey}:`)}`;
}

export default defineApp(
  { user: { accounts: { anvil: anvil.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.anvil ?? [],
        async (account) =>
          account.method === "oauth"
            ? withApprovals(
                await mcpRouter({
                  url: mcpUrl,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              )
            : withApprovals(
                await graphqlRouter({
                  url: graphqlUrl,
                  account,
                  headers: { Authorization: basic(account.fields.apiKey) },
                  cache,
                  signal,
                }),
                (tool) => (tool.kind === "mutation" ? always() : undefined),
              ),
        { signal },
      ),
      {
        title: "Anvil",
        description:
          "PDF filling and generation, Etch e-signatures, workflows and webforms through Anvil's MCP server (OAuth) or GraphQL API (API key).",
        icons,
      },
    ),
  }),
);
