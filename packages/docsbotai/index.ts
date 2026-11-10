import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  oauth2,
  query,
  record,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const url = "https://mcp.docsbot.ai";
const api = "https://docsbot.ai/api";

const docsbotai = defineProvider({
  name: "DocsBot AI",
  hosts: ["mcp.docsbot.ai", "docsbot.ai"],
  auth: {
    // Self-created user API key from https://docsbot.ai/app/api, used with the Admin REST API.
    apiKey: secrets({
      label: "User API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The admin MCP server publishes OAuth metadata and dynamic client registration.
    oauth: oauth2({ discover: url }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch(`${api}/teams`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, json());
  },
});

type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([A-Za-z]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method !== "GET" && op.method !== "DELETE";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${hasBody ? " Pass the JSON request body as body (see the DocsBot Admin API reference)." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? (args.body as Params | undefined) : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function restRouter(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, search: Params, body: Params | undefined) => {
    const target = new URL(`${api}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    if (response.headers.get("content-type")?.includes("text/csv")) return { csv: await response.text() };
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { docsbotai: docsbotai.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.docsbotai ?? [],
        async (account) =>
          account.method === "oauth"
            ? withApprovals(
                await mcpRouter({
                  url,
                  account,
                  headers: { Authorization: `Bearer ${account.fields.access_token}` },
                  signal,
                }),
                (t) => (toolAnnotations(t)?.readOnlyHint === true ? undefined : always()),
              )
            : withApprovals(restRouter(account.fields.token, fetch, signal), (t) =>
                t.kind === "mutation" ? always() : undefined,
              ),
        { signal },
      ),
      {
        title: "DocsBot AI",
        description: "Manage DocsBot AI teams, bots, sources, question and conversation history, leads and webhooks.",
        instructions:
          "An API-key account uses the hand-written Admin REST tools (teams, members, bots, sources, questions, conversations, leads, webhooks, research, stats); pass ids such as teamId and botId as strings, query parameters in query and JSON request bodies in body. An OAuth account uses the tools DocsBot's Admin MCP server advertises.",
        icons,
      },
    ),
  }),
);
