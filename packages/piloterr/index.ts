import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  oauth2,
  ProviderError,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.piloterr.com/";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// API keys go in x-api-key; OAuth access tokens are bearer tokens.
const headers = (account: Account): Record<string, string> =>
  account.method === "oauth"
    ? { Authorization: `Bearer ${account.fields.access_token}` }
    : { "x-api-key": account.fields.token };

const piloterr = defineProvider({
  name: "Piloterr",
  hosts: ["mcp.piloterr.com", "app.piloterr.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The MCP server advertises OAuth with dynamic client registration; its only scope is "piloterr".
    oauth: oauth2({ discover: url }),
  },
  // The server lists tools and answers initialize with any key, so mcpHealth cannot be used; only
  // tools/call checks the key. piloterr_usage is read-only; a bad key returns isError (HTTP 401 inside).
  health: async ({ account, fetch, signal }) => {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers(account) },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "piloterr_usage", arguments: {} } }),
    });
    if (response.status === 401) throw new ProviderError({ reason: "unauthorized", status: 401 });
    if (response.status === 403) throw new ProviderError({ reason: "forbidden", status: 403 });
    if (!response.ok) throw new ProviderError({ reason: "unavailable", status: response.status });
    // The reply is a JSON-RPC message, possibly framed as server-sent events.
    const text = await response.text();
    const data = text.split("\n").find((line) => line.startsWith("data:"))?.slice(5) ?? text;
    const message: { result?: { isError?: boolean; content?: { text?: string }[] }; error?: unknown } = JSON.parse(data);
    if (message.error !== undefined) throw new ProviderError({ reason: "unavailable" });
    if (message.result?.isError === true) {
      const detail = message.result.content?.[0]?.text ?? "";
      throw new ProviderError({ reason: /\b403\b/.test(detail) ? "forbidden" : /\b401\b|Invalid API Key/i.test(detail) ? "unauthorized" : "unavailable" });
    }
  },
});

export default defineApp(
  { user: { accounts: { piloterr: piloterr.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.piloterr ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Piloterr",
        description:
          "Web scraping and data extraction APIs: Google and other search engines, e-commerce products, LinkedIn, company data, email finder and verification, website crawling.",
        icons,
      },
    ),
  }),
);
