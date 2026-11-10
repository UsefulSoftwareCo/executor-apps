import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
  number,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every customer has its own instance, normally <name>.coupahost.com.
const hostPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9-]+)*\.(coupahost|coupacloud)\.com$/;

type Fields = { host: string; clientId: string; clientSecret: string; scopes: string };

function hostOf(raw: string): string {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!hostPattern.test(host)) throw new Error("Enter your Coupa instance host, for example acme.coupahost.com.");
  return host;
}

const coupa = defineProvider({
  name: "Coupa",
  hosts: ["*.coupahost.com", "*.coupacloud.com"],
  auth: {
    // The token URL is per instance, which a static oauth2 declaration cannot express, so the
    // client credentials grant is performed in code.
    clientCredentials: secrets({
      label: "OAuth2/OIDC client (client credentials)",
      fields: object({
        host: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
        scopes: plain(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const host = hostOf(account.fields.host);
    // Token exchange plus a read-only call that returns at most one user id; no field of the
    // response is decoded, so an instance with no readable users still passes.
    await client(account.fields, fetch, signal).call("GET", "/users", { limit: 1, fields: ["id"] });
    return { accountInfo: { externalId: `${host}:${account.fields.clientId}`, displayName: host } };
  },
});

type Fetch = typeof fetch;

async function accessToken(fetcher: Fetch, signal: AbortSignal | undefined, fields: Fields) {
  const host = hostOf(fields.host);
  const response = await fetcher(`https://${host}/oauth2/token`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    // Coupa's setup guide puts the client credentials in the form body, not an Authorization header.
    body: new URLSearchParams({
      client_id: fields.clientId,
      client_secret: fields.clientSecret,
      grant_type: "client_credentials",
      scope: fields.scopes.trim(),
    }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const host = hostOf(fields.host);
  let cached: { token: string; expires: number } | undefined;
  const token = async () => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(fetcher, signal, fields);
    // Coupa tokens last 24 hours; refresh well before that, or sooner if the server says so.
    const lifetime = Math.min((t.expires_in ?? 72_000) * 1000 * 0.9, 20 * 3_600_000);
    cached = { token: t.access_token, expires: Date.now() + lifetime };
    return t.access_token;
  };
  const call = async (method: Method, path: string, search: Params = {}, body?: unknown) => {
    const u = new URL(`https://${host}/api${path.startsWith("/") ? path : `/${path}`}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      u.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(u.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await token()}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return null;
    if (response.ok) {
      const text = await response.text();
      return text === "" ? null : JSON.parse(text);
    }
    return decodeJson(response, json());
  };
  return { call };
}

type Client = ReturnType<typeof client>;

const filters = record(json()).optional();
const paging =
  "Pass filters in query using Coupa operators as keys, e.g. {\"status[eq]\":\"approved\",\"updated-at[gt_or_eq]\":\"2026-01-01\"}. Pages hold at most 50 records: use limit and offset, and stop on an empty array. Use fields (a JSON field list such as [\"id\",\"po-number\"]) to trim responses.";

const resources = {
  purchaseOrders: ["purchase_orders", "Purchase orders"],
  invoices: ["invoices", "Supplier invoices"],
  suppliers: ["suppliers", "Suppliers"],
  requisitions: ["requisitions", "Purchase requisitions"],
  users: ["users", "Users"],
  expenseReports: ["expense_reports", "Expense reports"],
  contracts: ["contracts", "Contracts"],
  accounts: ["accounts", "General ledger accounts"],
  departments: ["departments", "Departments"],
  commodities: ["commodities", "Commodities"],
  currencies: ["currencies", "Currencies"],
  exchangeRates: ["exchange_rates", "Exchange rates"],
  items: ["items", "Catalog items"],
  lookupValues: ["lookup_values", "Lookup values"],
  projects: ["projects", "Projects"],
  addresses: ["addresses", "Addresses"],
  businessGroups: ["business_groups", "Business groups"],
  uoms: ["uoms", "Units of measure"],
  approvals: ["approvals", "Approvals"],
} as const;

function resourceRouter(c: Client, path: string, label: string) {
  return router(
    {
      list: query(
        { description: `List ${label.toLowerCase()} (GET /api/${path}). ${paging}`, input: object({ query: filters }) },
        async (_ctx, input) => c.call("GET", `/${path}`, input.query ?? {}),
      ),
      get: query(
        {
          description: `Retrieve one of ${label.toLowerCase()} by Coupa id (GET /api/${path}/{id}).`,
          input: object({ id: string({ minLength: 1 }), query: filters }),
        },
        async (_ctx, input) => c.call("GET", `/${path}/${encodeURIComponent(input.id)}`, input.query ?? {}),
      ),
    },
    { title: label, description: `${label} (/api/${path}).` },
  );
}

function build(c: Client) {
  const pathDoc =
    "path is what follows /api on your instance, for example /purchase_orders/123/attachments. Responses are JSON.";
  return router({
    ...Object.fromEntries(
      Object.entries(resources).map(([key, [path, label]]) => [key, resourceRouter(c, path, label)]),
    ),
    api: router(
      {
        get: query(
          {
            description: `Call any Coupa Core API GET endpoint. ${pathDoc} ${paging}`,
            input: object({ path: string({ minLength: 1 }), query: filters }),
          },
          async (_ctx, input) => c.call("GET", input.path, input.query ?? {}),
        ),
        send: mutation(
          {
            description: `Call any Coupa Core API endpoint that changes data: create (POST), update (PUT) or DELETE. Custom actions are PUT, e.g. /purchase_orders/123/issue. ${pathDoc}`,
            input: object({
              method: string().default("POST"),
              path: string({ minLength: 1 }),
              query: filters,
              body: json().optional(),
            }),
          },
          async (_ctx, input) => {
            const method = input.method.toUpperCase();
            if (method !== "POST" && method !== "PUT" && method !== "DELETE")
              throw new Error("method must be POST, PUT or DELETE.");
            return c.call(method, input.path, input.query ?? {}, input.body);
          },
        ),
      },
      { title: "Generic REST", description: "Any Core API endpoint your OAuth client has scopes for." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { coupa: coupa.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.coupa ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Coupa",
        description:
          "Purchase orders, invoices, suppliers, requisitions, users, expenses and any other Core API resource of one Coupa instance.",
        instructions:
          "Coupa field names are hyphenated in JSON (po-number, updated-at). Access depends on the scopes granted to the OAuth client: a 403 usually means a missing scope such as core.purchase_order.read. Use api.get and api.send for resources without a dedicated router.",
        icons,
      },
    ),
  }),
);
