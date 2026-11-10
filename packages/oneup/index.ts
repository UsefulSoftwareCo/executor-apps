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
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://feed.oneupapp.io/mcp/oneup";

type Account =
  | { method: "oauth"; fields: { access_token: string } }
  | { method: "apiKey"; fields: { apiKey: string } };

// The API key travels as the `apiKey` query parameter, as OneUp's MCP docs specify.
const endpoint = (account: Account) =>
  account.method === "apiKey" ? `${url}?apiKey=${encodeURIComponent(account.fields.apiKey)}` : url;
const headers = (account: Account): Record<string, string> =>
  account.method === "oauth" ? { Authorization: `Bearer ${account.fields.access_token}` } : {};

const oneup = defineProvider({
  name: "OneUp",
  hosts: ["feed.oneupapp.io"],
  auth: {
    // The server publishes OAuth metadata with dynamic client registration; its sign-in page asks for the API key.
    oauth: oauth2({ discover: url }),
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  // OneUp answers anonymous initialize and tools/list, so mcpHealth's anonymous-refusal test cannot pass.
  // Instead call a read-only tool: anonymous tools/call is refused with 401, an authenticated one succeeds.
  async health({ account, fetch, signal }) {
    const rpc = (id: number, method: string, params: unknown, session?: string) =>
      fetch(endpoint(account), {
        method: "POST",
        signal,
        headers: {
          ...headers(account),
          ...(session ? { "mcp-session-id": session } : {}),
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
      });
    const init = await rpc(1, "initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "executor", version: "1.0.0" },
    });
    const session = init.headers.get("mcp-session-id") ?? undefined;
    await decodeJson(init, object({ result: object({ serverInfo: object({ name: string() }) }) }));
    // A JSON-RPC error has no `result`, so decoding fails; a bad credential answers HTTP 401.
    const call = await rpc(2, "tools/call", { name: "list-categories-tool", arguments: {} }, session);
    await decodeJson(call, object({ result: object({}) }));
  },
});

export default defineApp(
  { user: { accounts: { oneup: oneup.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.oneup ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({ url: endpoint(account), account, headers: headers(account), cache, signal }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "OneUp",
        description:
          "Schedule and publish social media posts, manage comments and inbox conversations, and read analytics across connected accounts in OneUp.",
        icons,
      },
    ),
  }),
);
