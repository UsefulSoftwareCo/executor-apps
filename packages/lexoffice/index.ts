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

const base = "https://api.lexware.io/v1";

const lexoffice = defineProvider({
  name: "Lexoffice",
  hosts: ["api.lexware.io"],
  auth: {
    // Created at https://app.lexware.de/addons/public-api; sent as a Bearer token.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/profile`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const profile = await decodeJson(response, object({ organizationId: string(), companyName: string() }));
    return { accountInfo: { externalId: profile.organizationId, displayName: profile.companyName } };
  },
});

type Fetch = typeof fetch;
type Params = Record<string, unknown>;

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-zA-Z]+)\}/g)].map((match) => match[1]!);
}

function tool(op: Operation, call: (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PUT";
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
  { user: { accounts: { lexoffice: lexoffice.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.lexoffice ?? [],
        (account) =>
          withApprovals(rest(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Lexoffice",
        description:
          "Lexware Office (lexoffice) accounting: contacts, articles, invoices, quotations, order confirmations, credit notes, delivery notes, dunnings, vouchers, payments and webhooks.",
        icons,
        instructions:
          "The API allows 2 requests per second. Sales documents are created as drafts unless the query has finalize=true; finalized documents cannot be edited. Updates (PUT) need the current version number in the body.",
      },
    ),
  }),
);
