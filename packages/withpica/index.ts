import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
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

const url = "https://withpica.com/api/mcp";
// The endpoint lists three meta tools (pica_discover, pica_tool_details, pica_execute) unless layered=0,
// which lists every tool with its own annotations so approvals can tell reads from writes.
const toolsUrl = `${url}?layered=0`;

type Account =
  | { id: string; method: "apiKey"; fields: { token: string } }
  | { id: string; method: "oauth"; fields: { access_token: string } };

// API keys and OAuth access tokens are both sent as bearer tokens.
const headers = (account: Account) => ({
  Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
});

const withpica = defineProvider({
  name: "withPICA",
  hosts: ["withpica.com"],
  auth: {
    // Keys are created at https://withpica.com/settings?tab=connections.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The server also publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  // mcpHealth cannot be used: this server answers initialize and tools/list without credentials
  // (a "lobby" offering signup), so its anonymous comparison would reject every account.
  async health({ account, fetch, signal }) {
    const refuse = (reason: "unauthorized" | "forbidden", status?: number) =>
      new ProviderError({ reason, accountId: account.id, phase: "connect", ...(status === undefined ? {} : { status }) });
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
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "executor", version: "0.0.1" },
        },
      }),
    });
    // A bad key is a 400 with { error: "Invalid API key" }; a bad OAuth token is a 401.
    if (response.status === 401 || response.status === 400) throw refuse("unauthorized", response.status);
    if (response.status === 403) throw refuse("forbidden", 403);
    if (!response.ok) throw new Error(`withPICA initialize failed with HTTP ${response.status}`);
    const text = await response.text();
    // Streamable HTTP may answer with one JSON body or one SSE "data:" event.
    const data = text.trimStart().startsWith("{")
      ? text
      : (text.split("\n").find((line) => line.startsWith("data:"))?.slice(5) ?? "");
    const name: unknown = JSON.parse(data)?.result?.serverInfo?.name;
    if (typeof name !== "string") throw new Error("withPICA initialize returned no serverInfo");
    // Unauthenticated callers get the signup lobby instead of an error.
    if (name === "pica-http-lobby") throw refuse("unauthorized");
    return {};
  },
});

export default defineApp(
  { user: { accounts: { withpica: withpica.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.withpica ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({
              url: toolsUrl,
              account,
              headers: headers(account),
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "withPICA",
        description: "Works, recordings, credits, people, agreements and projects in a withPICA music catalogue.",
        instructions:
          "With an API key, the server requires pica_introduce_self to be called once before any other tool: declare the agent name, optionally role, the human it acts for, and model. OAuth connections do not need it.",
        icons,
      },
    ),
  }),
);
