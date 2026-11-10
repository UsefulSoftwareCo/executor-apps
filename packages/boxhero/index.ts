import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
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

const base = "https://rest.boxhero-app.com";

const boxhero = defineProvider({
  name: "BoxHero",
  hosts: ["rest.boxhero-app.com"],
  auth: {
    // BoxHero has no OAuth: tokens are created per team under Settings > Integrations.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/teams/linked`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const team = await decodeJson(response, object({ id: number(), name: string() }));
    return { accountInfo: { externalId: String(team.id), displayName: team.name } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function camel(value: string): string {
  return value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]!);
}

// Ids are integers; SKUs and order/return numbers are strings.
const stringParams = new Set(["sku", "order_number", "return_number"]);

function tool(op: Operation, call: (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PUT";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, stringParams.has(id) ? string() : number()])),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description} ${hasBody ? "Pass the JSON request body as body (see the BoxHero API reference). " : ""}${op.method === "GET" ? "Filters and cursor/limit go in query. " : ""}${op.method === "GET" ? "" : ""}`.trim();
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? (args.body as Params | undefined) : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${base}/v1${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
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
  for (const op of operations) {
    (groups[camel(op.group)] ??= {})[camel(op.name)] = tool(op, call);
  }
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { boxhero: boxhero.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.boxhero ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "BoxHero",
        description: "Inventory management in BoxHero: items, bundles, locations, partners, transactions, purchase orders, sales orders, returns, price lists and members.",
        instructions: "Most endpoints need a team in LOCATION mode (check teams.getLinkedTeam). Lists are cursor-paginated: pass the returned cursor in query. Rate limits are 5 requests per second and 300 per minute, shared across all of a team's tokens; exceeding them returns HTTP 429 with a Retry-After header.",
        icons,
      },
    ),
  }),
);
