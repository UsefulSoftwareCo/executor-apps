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

const url = "https://mcp.labs.storyblok.com/mcp";

type Account = { method: "token"; fields: { token: string } };

const headers = (account: Account) => ({ Authorization: `Bearer ${account.fields.token}` });

const storyblok = defineProvider({
  name: "Storyblok",
  hosts: ["mcp.labs.storyblok.com"],
  auth: {
    // The hosted server takes a Storyblok personal access token as a bearer token.
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The hosted server answers discovery (initialize, tools/list) without credentials, so the
  // generic mcpHealth can never verify an account. Instead run a read-only call that needs the
  // token: getCurrentUser answers 401 inside a normal tool result for a missing or invalid token.
  async health({ account, fetch, signal }) {
    const base = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...headers(account),
    };
    const rpc = async (body: object, session?: string) => {
      const response = await fetch(url, {
        method: "POST",
        signal,
        headers: session ? { ...base, "mcp-session-id": session } : base,
        body: JSON.stringify(body),
      });
      if (response.status === 401 || response.status === 403) {
        throw new ProviderError({ reason: "unauthorized", status: response.status });
      }
      if (!response.ok) throw new Error(`Storyblok MCP answered ${response.status}`);
      return { session: response.headers.get("mcp-session-id") ?? undefined, text: await response.text() };
    };
    // Replies are single JSON-RPC messages, plain or as one SSE "data:" event.
    const message = (text: string) => {
      const data = text.split("\n").find((line) => line.startsWith("data:"));
      return JSON.parse(data ? data.slice(5) : text) as {
        result?: { isError?: boolean; content?: { type: string; text?: string }[] };
        error?: { message?: string };
      };
    };
    const init = await rpc({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "executor", version: "1" } },
    });
    await rpc({ jsonrpc: "2.0", method: "notifications/initialized" }, init.session);
    // getCurrentUser is region-dependent and the account has no region, so try each region until
    // the token is accepted. An invalid token is refused by all of them.
    for (const region of ["eu", "us", "ca", "ap", "cn"]) {
      const reply = message(
        (
          await rpc(
            {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "execute_readonly",
                arguments: { operation: "getCurrentUser", region, fields: ["user.id", "user.userid"] },
              },
            },
            init.session,
          )
        ).text,
      );
      if (reply.error) throw new Error(reply.error.message ?? "Storyblok MCP error");
      const text = reply.result?.content?.find((part) => part.type === "text")?.text ?? "";
      let body: { success?: boolean; details?: { status?: number }; user?: { id?: number }; data?: { user?: { id?: number } } };
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error("Storyblok MCP returned an unreadable getCurrentUser result");
      }
      if (body.success === false || reply.result?.isError) {
        const status = body.details?.status;
        if (status === 401 || status === 403) continue;
        throw new Error("Storyblok rejected the getCurrentUser check");
      }
      const id = body.user?.id ?? body.data?.user?.id;
      return id === undefined ? undefined : { accountInfo: { externalId: String(id) } };
    }
    throw new ProviderError({ reason: "unauthorized", status: 401 });
  },
});

export default defineApp(
  { user: { accounts: { storyblok: storyblok.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.storyblok ?? [],
        async (account) =>
          withApprovals(await mcpRouter({ url, account, headers: headers(account), signal }), (tool) =>
            toolAnnotations(tool)?.readOnlyHint === true ? undefined : always(),
          ),
        { signal },
      ),
      {
        title: "Storyblok",
        description: "Stories, components, assets, datasources and spaces in Storyblok.",
        icons,
      },
    ),
  }),
);
