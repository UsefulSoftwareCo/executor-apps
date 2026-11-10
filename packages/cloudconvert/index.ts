import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
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

const url = "https://mcp.cloudconvert.com";
const base = "https://api.cloudconvert.com/v2";

const cloudconvert = defineProvider({
  name: "CloudConvert",
  hosts: ["api.cloudconvert.com", "mcp.cloudconvert.com", "cloudconvert.com"],
  auth: {
    // API keys are created at https://cloudconvert.com/dashboard/api/v2/keys and sent as a Bearer token.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // The MCP server publishes OAuth metadata and supports dynamic client registration (PKCE S256).
    oauth: oauth2({ discover: url }),
  },
  async health(check) {
    const { account, fetch, signal } = check;
    if (account.method === "oauth") {
      return mcpHealth(check, { url, headers: { Authorization: `Bearer ${account.fields.access_token}` } });
    }
    const response = await fetch(`${base}/users/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const me = await decodeJson(response, object({ data: object({ id: json() }) }));
    return { accountInfo: { externalId: String(me.data.id) } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" && !op.path.endsWith("/cancel") && !op.path.endsWith("/retry");
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? (args.body as Params | undefined) : undefined);
  };
  return op.method === "GET" ? query({ description: op.description, input }, run) : mutation({ description: op.description, input }, run);
}

function rest(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, search: Params, body: Params | undefined) => {
    const target = new URL(`${base}${path}`);
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
    return decodeJson(response, json());
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { cloudconvert: cloudconvert.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cloudconvert ?? [],
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
            : withApprovals(rest(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "CloudConvert",
        description:
          "Convert, optimize, merge, archive, watermark and capture files in 200+ formats with CloudConvert jobs and tasks.",
        icons,
      },
    ),
  }),
);
