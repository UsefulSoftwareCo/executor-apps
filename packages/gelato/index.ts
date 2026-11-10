import {
  accountRouter,
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
import { operations, type Host, type Operation } from "./operations.js";

const origins: Record<Host, string> = {
  order: "https://order.gelatoapis.com",
  product: "https://product.gelatoapis.com",
  shipment: "https://shipment.gelatoapis.com",
  ecommerce: "https://ecommerce.gelatoapis.com",
};

const gelato = defineProvider({
  name: "Gelato",
  hosts: Object.values(origins).map((origin) => new URL(origin).host),
  auth: {
    // Created in the Gelato dashboard under Developer > API keys; sent in the X-API-KEY header.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origins.product}/v3/catalogs`, {
      signal,
      headers: { "X-API-KEY": account.fields.token },
    });
    if (!response.ok) throw new Error(`Gelato health check failed (${response.status})`);
  },
});

type Params = Record<string, unknown>;

function tool(op: Operation, call: (op: Operation, input: Params) => Promise<unknown>) {
  const input = object({ params: record(json()).optional() });
  const where = op.method === "GET" || op.method === "DELETE" ? "query string" : "JSON body";
  const description = `${op.description} Pass path parameters and ${where} fields together as params.`;
  const run = async (_ctx: unknown, args: Params) => call(op, (args.params as Params | undefined) ?? {});
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function rest(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, input: Params) => {
    const missing = (op.required ?? []).filter((key) => input[key] === undefined);
    if (missing.length > 0) throw new Error(`Missing required field(s) in params: ${missing.join(", ")}`);
    const pathKeys = new Set<string>();
    const path = op.path.replace(/\{(\w+)\}/g, (_, key: string) => {
      pathKeys.add(key);
      return encodeURIComponent(String(input[key]));
    });
    const rest = Object.fromEntries(Object.entries(input).filter(([key]) => !pathKeys.has(key)));
    const hasBody = op.method === "POST" || op.method === "PATCH";
    const target = new URL(`${origins[op.host]}${path}`);
    if (!hasBody) {
      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined && value !== null) target.searchParams.set(key, String(value));
      }
    }
    const sendBody = hasBody && !(op.path.endsWith(":cancel") && Object.keys(rest).length === 0);
    const response = await fetcher(target.toString(), {
      method: op.method,
      signal,
      headers: { "X-API-KEY": token, ...(sendBody ? { "Content-Type": "application/json" } : {}) },
      ...(sendBody ? { body: JSON.stringify(rest) } : {}),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Gelato ${op.method} ${path} failed (${response.status}): ${text}`);
    return text === "" ? { ok: true } : JSON.parse(text);
  };
  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[op.group] ??= {})[op.name] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { gelato: gelato.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gelato ?? [],
        (account) =>
          withApprovals(rest(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Gelato",
        description:
          "Gelato print-on-demand: create, quote, search and cancel orders, browse the product catalog, prices, stock and shipment methods, and manage store products.",
        icons,
      },
    ),
  }),
);
