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

const base = "https://api.donately.com";
// Dated API version; the API defaults to the older 2019-03-15 shape when the header is absent.
const version = "2022-12-15";

// Tokens come from the Donately dashboard (Settings > API) and are sent as HTTP Basic auth: base64("<token>:").
const authorization = (token: string) => `Basic ${btoa(`${token}:`)}`;

const donately = defineProvider({
  name: "Donately",
  hosts: ["api.donately.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v2/accounts/mine`, {
      signal,
      headers: { Authorization: authorization(account.fields.token), "Donately-Version": version },
    });
    const body = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: body.id } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function tool(op: Operation, call: (op: Operation, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const hasId = op.path.includes("{id}");
  const hasBody = op.method === "POST";
  const input = object({
    ...(hasId ? { id: string() } : {}),
    query: record(json()).optional(),
    ...(hasBody ? { body: record(json()).optional() } : {}),
  });
  const description = `${op.description}${hasBody ? " Pass the JSON request body as body." : ""}${
    op.method === "GET" ? " Pass query parameters as query." : ""
  }`;
  const run = async (_ctx: unknown, args: Params) => {
    const path = op.path.replace("{id}", encodeURIComponent(String(args.id)));
    return call(op, path, (args.query as Params | undefined) ?? {}, hasBody ? (args.body as Params | undefined) : undefined);
  };
  return op.method === "GET" ? query({ description, input }, run) : mutation({ description, input }, run);
}

function rest(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (op: Operation, path: string, search: Params, body: Params | undefined) => {
    const target = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (typeof value === "object") {
        // Range filters such as created: {gt, lt} use bracket syntax.
        for (const [inner, innerValue] of Object.entries(value as Params)) target.searchParams.set(`${key}[${inner}]`, String(innerValue));
      } else target.searchParams.set(key, String(value));
    }
    const response = await fetcher(target.toString(), {
      method: op.method,
      signal,
      headers: {
        Authorization: authorization(token),
        "Donately-Version": version,
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
  { user: { accounts: { donately: donately.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.donately ?? [],
        (account) =>
          withApprovals(rest(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Donately",
        description: "Donately fundraising: accounts, campaigns, donations, recurring subscriptions, donors, fundraisers, donation forms and webhooks.",
        instructions:
          "Most endpoints need an account: pass account_id (act_...) in query, or in body for creates. Call accounts.mine first to find the token's account. List responses use limit (max 100) and offset.",
        icons,
      },
    ),
  }),
);
