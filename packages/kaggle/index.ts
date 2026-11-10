import {
  ProviderError,
  accountRouter,
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
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://www.kaggle.com/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// Kaggle API tokens and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const kaggleMcp = defineProvider({
  name: "Kaggle",
  hosts: ["www.kaggle.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Kaggle advertises dynamic client registration (PKCE S256), but only for localhost
    // redirect URIs; a host with an https callback falls back to a user-supplied client.
    oauth: oauth2({ discover: url }),
  },
  // Kaggle's MCP server answers initialize and tools/list without credentials, so mcpHealth
  // cannot verify an account. get_accelerator_quota reads the caller's own quota, takes no
  // arguments, and answers anonymous or invalid tokens with isError "Unauthenticated".
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: {
        ...headers(account),
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "get_accelerator_quota", arguments: { request: {} } },
      }),
    });
    if (response.status === 401 || response.status === 403)
      throw new ProviderError({ reason: "unauthorized", status: response.status });
    if (response.status === 429) throw new ProviderError({ reason: "rate_limited", status: 429 });
    if (!response.ok) throw new ProviderError({ reason: "unavailable", status: response.status });
    const text = await response.text();
    const data = text
      .split("\n")
      .find((line) => line.startsWith("data:"))
      ?.slice(5);
    const message: unknown = JSON.parse(data ?? text);
    const result = (message as { result?: { isError?: unknown } } | null)?.result;
    if (result === undefined) throw new Error("Kaggle's MCP server returned no result for the account check.");
    if (result.isError === true) throw new ProviderError({ reason: "unauthorized" });
  },
});

export default defineApp(
  { user: { accounts: { kaggleMcp: kaggleMcp.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kaggleMcp ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Kaggle",
        description: "Kaggle competitions, datasets, notebooks, models, benchmarks, hackathons and forums.",
        icons,
      },
    ),
  }),
);
