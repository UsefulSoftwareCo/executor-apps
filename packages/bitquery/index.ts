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

const url = "https://streaming.bitquery.io/graphql";
const mcpUrl = "https://mcp.bitquery.io/mcp";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "apiKey"; fields: { token: string } };

const bearer = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const bitquery = defineProvider({
  name: "Bitquery",
  hosts: ["streaming.bitquery.io", "mcp.bitquery.io"],
  auth: {
    // The MCP server's own sign-in (OAuth 2.1 with dynamic client registration, scope api).
    oauth: oauth2({ discover: mcpUrl }),
    // Access token from account.bitquery.io; accepted by both the GraphQL API and the MCP server.
    apiKey: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health(check) {
    const { account } = check;
    if (account.method === "oauth") return mcpHealth(check, { url: mcpUrl, headers: bearer(account) });
    // Bitquery has no current-user query; a typename query proves the token is accepted.
    const response = await check.fetch(url, {
      method: "POST",
      signal: check.signal,
      headers: { ...bearer(account), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    await decodeJson(response, object({ data: object({ __typename: string() }) }));
    return { accountInfo: { externalId: "bitquery", displayName: "Bitquery" } };
  },
});

export default defineApp({ user: { accounts: { bitquery: bitquery.many() } }, icons }, async ({ user, cache, signal }) => ({
  tools: router(
    {
      // Trading OHLC/trades, tracing, AML/KYC risk, sanctions screening and clustering. Read-only server side.
      mcp: await accountRouter(
        user?.accounts.bitquery ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url: mcpUrl, account, headers: bearer(account), cache, signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      graphql: router(
        await accountRouter(
          (user?.accounts.bitquery ?? []).filter((account) => account.method === "apiKey"),
          async (account) =>
            withApprovals(
              await graphqlRouter({ url, account, headers: bearer(account), cache, signal }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            ),
          { signal },
        ),
        {
          title: "Bitquery GraphQL",
          description: "V2 streaming GraphQL API: arbitrary queries over transfers, DEX trades, balances, blocks and events on 40+ chains. Requires an access token account.",
        },
      ),
    },
    {
      title: "Bitquery",
      description:
        "Indexed on-chain data for 40+ blockchains. mcp: curated trading, tracing, AML and sanctions tools. graphql: free-form V2 queries (access token only).",
      icons,
    },
  ),
}));
