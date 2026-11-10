import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
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

const mcpUrl = "https://mcp.dynamicmockups.com";

const dynamicmockups = defineProvider({
  name: "Dynamic Mockups",
  hosts: ["mcp.dynamicmockups.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health(check) {
    // The server answers initialize and tools/list anonymously, so mcpHealth cannot verify a key.
    // Initialize a session, then call a read-only tool that enforces auth (a bad key is isError 401).
    const { account, fetch, signal } = check;
    const send = async (body: unknown, sessionId?: string) => {
      const response = await fetch(mcpUrl, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "x-api-key": account.fields.apiKey,
          ...(sessionId ? { "mcp-session-id": sessionId } : {}),
        },
        body: JSON.stringify(body),
      });
      if (response.status === 401) throw new ProviderError({ reason: "unauthorized", status: 401 });
      if (response.status === 429) throw new ProviderError({ reason: "rate_limited", status: 429 });
      if (!response.ok) throw new ProviderError({ reason: "unavailable", status: response.status });
      const text = await response.text();
      const data = text
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("");
      const message = JSON.parse(data || text) as { result?: { isError?: boolean } };
      return { sessionId: response.headers.get("mcp-session-id") ?? undefined, message };
    };
    const init = await send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "executor", version: "1" },
      },
    });
    const called = await send(
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_catalogs", arguments: {} } },
      init.sessionId,
    );
    if (called.message.result?.isError !== false) {
      throw new ProviderError({ reason: "unauthorized", status: 401 });
    }
  },
});

export default defineApp(
  { user: { accounts: { dynamicmockups: dynamicmockups.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dynamicmockups ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({
              url: mcpUrl,
              account,
              headers: { "x-api-key": account.fields.apiKey },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "Dynamic Mockups",
        description:
          "Render product mockups: browse catalogs, collections and mockup templates, create single, batch and collection renders, generate mockups with MockAnything AI and videos with MotionMockups, export print files, and upload PSDs.",
        icons,
      },
    ),
  }),
);
