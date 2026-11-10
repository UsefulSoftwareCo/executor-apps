import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  router,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://mcp.memberstack.com/mcp";

type Account = { method: "oauth"; fields: { access_token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.access_token}` });

const memberstack = defineProvider({
  name: "Memberstack",
  hosts: ["mcp.memberstack.com"],
  auth: {
    // The server publishes OAuth 2.1 metadata with dynamic client registration and PKCE.
    oauth: oauth2({ discover: url }),
  },
  // The server answers tools/list without credentials, so the stock mcpHealth (which rejects servers that
  // answer anonymously) cannot be used. Call the read-only currentUser tool with the token instead and
  // decode only the success flag.
  async health({ account, fetch, signal }) {
    const send = async (body: unknown, session?: string) => {
      const response = await fetch(url, {
        method: "POST",
        signal,
        headers: {
          ...headers(account),
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          ...(session === undefined ? {} : { "Mcp-Session-Id": session }),
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`Memberstack MCP health check failed (${response.status})`);
      const text = await response.text();
      const data = text.split("\n").find((line) => line.startsWith("data:"));
      const message = JSON.parse(data === undefined ? text : data.slice(5)) as {
        error?: { message?: string };
        result?: { isError?: boolean };
      };
      return { session: response.headers.get("mcp-session-id") ?? session, message };
    };
    const init = await send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "executor", version: "0" } },
    });
    if (init.message.error) throw new Error(`Memberstack MCP initialize failed: ${init.message.error.message ?? "error"}`);
    await send({ jsonrpc: "2.0", method: "notifications/initialized" }, init.session).catch(() => undefined);
    const call = await send(
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "currentUser",
          arguments: { context: "Verifying the connected Memberstack account by reading the current signed in user for a health check" },
        },
      },
      init.session,
    );
    if (call.message.error || call.message.result?.isError === true)
      throw new Error(`Memberstack currentUser failed: ${call.message.error?.message ?? "tool error"}`);
  },
});

export default defineApp(
  { user: { accounts: { memberstack: memberstack.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.memberstack ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Memberstack",
        description: "Members, plans, data tables and gated content in Memberstack.",
        icons,
      },
    ),
  }),
);
