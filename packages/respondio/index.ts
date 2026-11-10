import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const base = "https://api.respond.io/v2";

const respondio = defineProvider({
  name: "Respond.io",
  hosts: ["api.respond.io"],
  auth: {
    // Respond.io offers no user-created OAuth apps; Developer API access tokens only.
    apiKey: secrets({
      label: "Developer API access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/space/user?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Params = Record<string, unknown>;
type Call = (method: string, path: string, search: Params, body: unknown) => Promise<unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([A-Za-z]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: Call) {
  const ids = pathParams(op.path);
  const hasBody = op.method !== "GET";
  const input = object({
    ...Object.fromEntries(ids.map((name) => [name, string()])),
    ...(op.paginated || op.name === "list" ? { query: record(json()).optional() } : {}),
    ...(hasBody ? { body: json().optional() } : {}),
  });
  const description = `${op.description}${op.paginated ? " Pagination: limit (1-100) and cursorId in query." : ""}${hasBody ? " Pass the JSON request body as body." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const name of ids) path = path.replace(`{${name}}`, encodeURIComponent(String(args[name])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? args.body : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call: Call = async (method, path, search, body) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
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
  { user: { accounts: { respondio: respondio.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.respondio ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Respond.io",
        description: "Contacts, messages, conversations, comments, tags, custom fields, channels and templates in Respond.io.",
        instructions: "Contacts are addressed by identifier: id:<contactId>, email:<address> or phone:<E.164 number>.",
        icons,
      },
    ),
  }),
);
