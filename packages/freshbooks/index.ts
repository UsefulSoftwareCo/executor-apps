import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  record,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { operations, type Operation } from "./operations.js";

const base = "https://api.freshbooks.com";

// Objects with documented read/write scope pairs. user:profile:read and user:business:read are
// requested separately: the scopes page only confirms a read scope for profile, and business is
// only used read-only here (identity lookup).
const scopeObjects = [
  "invoices", "clients", "estimates", "expenses", "payments", "credit_notes", "bills",
  "bill_payments", "bill_vendors", "billable_items", "taxes", "other_income", "journal_entries", "projects",
  "time_entries",
];

// FreshBooks has no client registration: the connect page asks for the client of an app created in
// the developer portal. The vendor's curl examples send JSON token requests (encoding is not
// stated in the docs), and refresh tokens are single-use.
const freshbooks = defineProvider({
  name: "FreshBooks",
  hosts: ["api.freshbooks.com", "auth.freshbooks.com"],
  auth: {
    oauth: oauth2({
      authorizationUrl: "https://auth.freshbooks.com/oauth/authorize",
      tokenUrl: `${base}/auth/oauth/token`,
      revocationUrl: `${base}/auth/oauth/revoke`,
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: [
        "user:profile:read",
        "user:business:read",
        ...scopeObjects.flatMap((name) => [`user:${name}:read`, `user:${name}:write`]),
        "user:reports:read",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/auth/api/v1/users/me`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    const { response: me } = await decodeJson(
      response,
      object({ response: object({ id: number(), first_name: string(), last_name: string(), email: string() }) }),
    );
    return {
      accountInfo: {
        externalId: String(me.id),
        displayName: `${me.first_name} ${me.last_name}`.trim() || me.email,
        email: me.email,
      },
    };
  },
});

type Params = Record<string, unknown>;

function camel(value: string): string {
  return value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]!);
}

function tool(
  op: Operation,
  call: (method: string, path: string, search: Params, body: Params | undefined) => Promise<unknown>,
) {
  const ids = pathParams(op.path);
  const hasBody = op.method === "POST" || op.method === "PUT";
  const input = object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...(op.method === "GET" ? { query: record(json()).optional() } : {}),
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

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, search: Params, body: Params | undefined) => {
    const url = new URL(`${base}${path}`);
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
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  const groups: Record<string, Record<string, ReturnType<typeof tool>>> = {};
  for (const op of operations) (groups[camel(op.group)] ??= {})[camel(op.name)] = tool(op, call);
  return router(Object.fromEntries(Object.entries(groups).map(([name, tools]) => [name, router(tools)])));
}

export default defineApp(
  { user: { accounts: { freshbooks: freshbooks.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.freshbooks ?? [],
        (account) =>
          withApprovals(build(account.fields.access_token, fetch, signal), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "FreshBooks",
        description:
          "Invoices, clients, estimates, expenses, payments, credit notes, bills, items, taxes, projects, time entries, services and accounting reports in FreshBooks.",
        instructions:
          "Call identity.getMe first: response.business_memberships[].business.account_id is the account_id for accounting tools, and business.id (not the membership id) is the business_id for projects, time entries and services. Request and response bodies wrap the object in its singular name (for example {\"invoice\": {...}}) and lists return under response.result.<plural>. Lists page with page and per_page (max 100); filters use query keys like search[clientid]=123.",
        icons,
      },
    ),
  }),
);
