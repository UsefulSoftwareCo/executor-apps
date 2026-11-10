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

const url = "https://api.certifier.io/v1/mcp";
const base = "https://api.certifier.io/v1";
const version = "2022-10-26";

const certifier = defineProvider({
  name: "Certifier",
  hosts: ["api.certifier.io"],
  auth: {
    // Access tokens are created under Settings > Developers > Access Tokens and sent as a Bearer token.
    token: secrets({
      label: "Access token",
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
    const response = await fetch(`${base}/credentials?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "Certifier-Version": version },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PATCH";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${hasBody ? " Pass the JSON request body as body." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? (args.body as Params | undefined) : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
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
        "Certifier-Version": version,
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
  { user: { accounts: { certifier: certifier.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.certifier ?? [],
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
        title: "Certifier",
        description:
          "Certifier digital credentials: create, issue, send and search certificates and badges, manage credential templates and design templates.",
        icons,
      },
    ),
  }),
);
