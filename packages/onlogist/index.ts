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

const hostFor = {
  production: "portal.onlogist.com",
  sandbox: "dev.portal.onlogist.com",
} as const;

// Production is the default; "sandbox" targets the developer portal.
function baseFor(environment: string | undefined) {
  const key = (environment ?? "production").trim().toLowerCase();
  if (key !== "production" && key !== "sandbox")
    throw new Error('Environment must be "production" or "sandbox".');
  return `https://${hostFor[key]}/api/v1/transportation`;
}

const onlogist = defineProvider({
  name: "ONLOGIST",
  hosts: ["portal.onlogist.com", "dev.portal.onlogist.com"],
  auth: {
    // The API key goes in the Authorization header as it is (no Bearer prefix).
    apiKey: secrets({
      label: "API key",
      fields: object({
        token: string({ minLength: 1 }),
        // "production" (portal.onlogist.com, default) or "sandbox" (dev.portal.onlogist.com).
        environment: string().optional(),
      }),
    }),
  },
  // The API has no current-user endpoint; listing qualifications is a cheap authenticated read.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${baseFor(account.fields.environment)}/qualifications`, {
      signal,
      headers: { Authorization: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z_]+)\}/g)].map((match) => match[1]!);
}

function tool(
  op: Operation,
  call: (method: string, path: string, search: Params, body: unknown) => Promise<unknown>,
) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PUT";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${hasBody ? " Pass JSON fields as body." : ""}`;
  const run = async (_ctx: unknown, args: Params) => {
    let path = op.path;
    for (const id of ids) path = path.replace(`{${id}}`, encodeURIComponent(String(args[id])));
    let body: unknown;
    if (hasBody) {
      const given = (args.body as Params | undefined) ?? {};
      // Array endpoints take a raw JSON array; callers pass it as body.items.
      body = Array.isArray(given.items) ? given.items : given;
    }
    return call(op.method, path, (args.query as Params | undefined) ?? {}, body);
  };
  const readOnly = op.readOnly ?? op.method === "GET";
  return readOnly ? query({ description, input }, run) : mutation({ description, input }, run);
}

function build(token: string, base: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (verb: string, path: string, search: Params, body: unknown) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method: verb,
      signal,
      headers: {
        Authorization: token,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    const text = await response.clone().text();
    if (response.ok && text.trim() === "") return { ok: true };
    return decodeJson(response, json());
  };

  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { onlogist: onlogist.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.onlogist ?? [],
        (account) =>
          withApprovals(build(account.fields.token, baseFor(account.fields.environment), fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ONLOGIST",
        description:
          "Order vehicle transfers on ONLOGIST: orders, price offers, messages, locations, cost centers, changes, qualifications and invoices.",
        instructions:
          "Filters go in query, JSON write fields in body. Endpoints that take a raw JSON array (orders.createBulk, orders.getStatuses, orders.markPaid, orders.cancelBatch, locations.uploadCars) take it as body.items. Orders are addressed by UUID.",
        icons,
      },
    ),
  }),
);
