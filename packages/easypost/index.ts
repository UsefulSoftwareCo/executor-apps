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

const base = "https://api.easypost.com/v2";

// HTTP Basic: the API key is the username and the password is empty.
function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Basic ${btoa(`${token}:`)}` };
}

const easypost = defineProvider({
  name: "EasyPost",
  hosts: ["api.easypost.com"],
  auth: {
    // Test or production key: EasyPost dashboard > Account > API Keys (https://www.easypost.com/account/api-keys).
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /users would be the natural check but is production-only; listing addresses works with test keys too.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/addresses?page_size=1`, {
      signal,
      headers: { ...authHeaders(account.fields.token), Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z_]+)\}/g)].map((match) => match[1]!);
}

function tool(
  op: Operation,
  call: (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>,
) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PUT" || op.method === "PATCH";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${hasBody ? " Pass JSON fields as body." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    return call(op.method, path, (args.query as Params | undefined) ?? {}, hasBody ? ((args.body as Params | undefined) ?? {}) : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (verb: string, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method: verb,
      signal,
      headers: {
        ...authHeaders(token),
        Accept: "application/json",
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
  { user: { accounts: { easypost: easypost.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.easypost ?? [],
        (account) =>
          withApprovals(build(account.fields.token, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "EasyPost",
        description:
          "Shipping with EasyPost: addresses, parcels, shipments and rates, labels, trackers, batches, pickups, insurance, claims, refunds, carrier accounts, webhooks and reports.",
        instructions:
          "To ship: addresses.createAndVerify (optional), shipments.create with to_address, from_address and parcel to get rates, then shipments.buy with the chosen rate id. Create calls wrap fields in a key named for the object, e.g. body { shipment: {...} }. Weights are in ounces, dimensions in inches. Test keys return fake labels; users.getMe works only with production keys.",
        icons,
      },
    ),
  }),
);
