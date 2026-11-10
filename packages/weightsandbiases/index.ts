import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { graphqlRouter } from "apps/graphql";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://api.wandb.ai/graphql";
const mcpUrl = "https://mcp.withwandb.com/mcp";

type Account = { fields: { token: string } };

// The wandb SDK sends GraphQL requests with HTTP Basic auth, user name "api" and the API key as password
// (requests auth=("api", api_key) in wandb/sdk/internal/internal_api.py).
const authorization = (account: Account) => ({
  Authorization: `Basic ${btoa(`api:${account.fields.token}`)}`,
});

// The hosted MCP server takes the raw API key as a bearer token.
const mcpHeaders = (account: Account) => ({ Authorization: `Bearer ${account.fields.token}` });

const wandb = defineProvider({
  name: "Weights & Biases",
  hosts: ["api.wandb.ai", "mcp.withwandb.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { ...authorization(account), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ viewer { id name } }" }),
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error("Invalid Weights & Biases API key. Create one at https://wandb.ai/authorize.");
    }
    const { data } = await decodeJson(response, object({ data: object({ viewer: object({ id: string(), name: string() }) }) })).catch(
      () => {
        throw new Error("Invalid Weights & Biases API key: the API returned no user for it (or the request failed). Create one at https://wandb.ai/authorize.");
      },
    );
    return { accountInfo: { externalId: data.viewer.id, displayName: data.viewer.name } };
  },
});

export default defineApp(
  { user: { accounts: { wandb: wandb.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wandb ?? [],
        async (account) =>
          router(
            {
              graphql: withApprovals(
                await graphqlRouter({ url, account, headers: authorization(account), cache, signal }),
                (tool) => (tool.kind === "mutation" ? always() : undefined),
              ),
              mcp: withApprovals(
                await mcpRouter({ url: mcpUrl, account, headers: mcpHeaders(account), cache, signal }),
                (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
              ),
            },
            {
              title: "Weights & Biases",
              description:
                "Use graphql for the full W&B API (projects, runs, sweeps, artifacts, teams); use mcp for Weave trace and evaluation analysis, run diagnostics, docs search and reports.",
            },
          ),
        { signal },
      ),
      {
        title: "Weights & Biases",
        description: "Projects, runs, sweeps, artifacts, reports, teams and organizations through the W&B GraphQL API.",
        icons,
      },
    ),
  }),
);
