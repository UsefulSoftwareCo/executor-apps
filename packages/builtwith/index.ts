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

const url = "https://api.builtwith.com/mcp";

type Account =
  | { method: "apiKey"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

// BuiltWith API keys and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const builtwith = defineProvider({
  name: "BuiltWith",
  hosts: ["api.builtwith.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Discovery reads the server's RFC 8414 / protected-resource metadata (scopes api.read, api.write; PKCE S256; public client; dynamic registration).
    oauth: oauth2({ discover: url }),
  },
  // The server answers initialize and tools/list without credentials, so mcpHealth cannot be used.
  // usage-api is read-only and free; a bad key yields {"Errors":[{"Message":"API Key is incorrect",...}]}.
  health: async ({ account, fetch, signal }) => {
    const post = async (body: unknown) => {
      const response = await fetch(url, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers(account) },
        body: JSON.stringify(body),
      });
      if (response.status === 401) throw new ProviderError({ reason: "unauthorized", status: 401 });
      if (response.status === 403) throw new ProviderError({ reason: "forbidden", status: 403 });
      if (!response.ok) throw new ProviderError({ reason: "unavailable", status: response.status });
      return response.text();
    };
    await post({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "executor-health", version: "1.0.0" } },
    });
    await post({ jsonrpc: "2.0", method: "notifications/initialized" });
    const text = await post({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "usage-api", arguments: {} } });
    // The reply is a JSON-RPC message, possibly framed as server-sent events. The tool's own text is JSON.
    const data = text.split("\n").find((line) => line.startsWith("data:"))?.slice(5) ?? text;
    const result: { result?: { content?: { text?: string }[] } } = JSON.parse(data);
    const payload: { Errors?: unknown[]; error?: unknown } = JSON.parse(result.result?.content?.[0]?.text ?? "{}");
    if ((Array.isArray(payload.Errors) && payload.Errors.length > 0) || typeof payload.error === "string")
      throw new ProviderError({ reason: "unauthorized" });
  },
});

export default defineApp(
  { user: { accounts: { builtwith: builtwith.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.builtwith ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "BuiltWith",
        description: "BuiltWith website technology profiling: domain technology lookups, technology lists, relationships, trends, company-to-URL, trust, keyword search, recommendations, usage and credits, plus keyless MPP and x402 pay-per-call purchase tools, an MCP registry search, and vector/ask tools.",
        icons,
      },
    ),
  }),
);
