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
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://integration.upsales.com/api/v2";

const upsales = defineProvider({
  name: "Upsales",
  hosts: ["integration.upsales.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users?limit=1&token=${encodeURIComponent(account.fields.token)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const url = (account: Account, path: string, params: Record<string, string | number | undefined> = {}) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  out.set("token", account.fields.token);
  return `${base}${path}?${out.toString()}`;
};

const jsonHeaders = { Accept: "application/json", "content-type": "application/json" };

const listInput = object({
  limit: number().optional(),
  offset: number().optional(),
  sort: string().optional(),
  filter: string().optional(),
});

const resources = [
  { key: "accounts", path: "/accounts", label: "company (account)", plural: "companies" },
  { key: "contacts", path: "/contacts", label: "contact", plural: "contacts" },
  { key: "users", path: "/users", label: "user", plural: "users" },
  { key: "orders", path: "/orders", label: "order or opportunity (an order with a probability below 100 is an opportunity)", plural: "orders and opportunities" },
  { key: "agreements", path: "/agreements", label: "agreement (subscription)", plural: "agreements" },
  { key: "activities", path: "/activities", label: "activity", plural: "activities" },
  { key: "appointments", path: "/appointments", label: "appointment", plural: "appointments" },
  { key: "products", path: "/products", label: "product", plural: "products" },
  { key: "projects", path: "/projects", label: "project", plural: "projects" },
  { key: "todo", path: "/todo", label: "task (to-do)", plural: "tasks" },
] as const;

const writable = new Set(["accounts", "contacts", "orders", "agreements", "activities", "appointments", "products", "projects", "todo"]);
const deletable = new Set(["accounts", "contacts", "orders", "agreements", "activities", "appointments", "products", "projects", "todo"]);

const upsalesTools = (account: Account, signal: AbortSignal) => {
  const tools: Record<string, unknown> = {};
  for (const r of resources) {
    tools[`${r.key}List`] = query(
      {
        description: `List ${r.plural}. limit (default 100, max 1000), offset, sort (field name, prefix with - for descending). filter is a raw Upsales query-string fragment such as "q=name:eq:Acme" appended to the request (see Upsales API docs for the attribute:comparator:value syntax). Returns { data, metadata: { total, limit, offset } }.`,
        input: listInput,
      },
      async ({ fetch }, { filter, ...params }) => {
        const extra = filter === undefined || filter === "" ? "" : `&${filter.replace(/^[?&]/, "")}`;
        return decodeJson(
          await fetch(url(account, r.path, params) + extra, { signal, headers: { Accept: "application/json" } }),
          json(),
        );
      },
    );
    tools[`${r.key}Get`] = query(
      { description: `Get one ${r.label} by id.`, input: object({ id: number() }) },
      async ({ fetch }, { id }) =>
        decodeJson(await fetch(url(account, `${r.path}/${id}`), { signal, headers: { Accept: "application/json" } }), json()),
    );
    if (writable.has(r.key)) {
      tools[`${r.key}Create`] = mutation(
        {
          description: `Create a ${r.label}. body is the JSON object as documented by Upsales for ${r.path}; required fields vary by resource (for example name for companies, client.id and user.id for orders).`,
          input: object({ body: json() }),
          approval: always(),
        },
        async ({ fetch }, { body }) =>
          decodeJson(
            await fetch(url(account, r.path), { method: "POST", signal, headers: jsonHeaders, body: JSON.stringify(body) }),
            json(),
          ),
      );
      tools[`${r.key}Update`] = mutation(
        {
          description: `Update a ${r.label} by id. body holds the fields to change (PUT; send the fields you want set).`,
          input: object({ id: number(), body: json() }),
          approval: always(),
        },
        async ({ fetch }, { id, body }) =>
          decodeJson(
            await fetch(url(account, `${r.path}/${id}`), {
              method: "PUT",
              signal,
              headers: jsonHeaders,
              body: JSON.stringify(body),
            }),
            json(),
          ),
      );
    }
    if (deletable.has(r.key)) {
      tools[`${r.key}Delete`] = mutation(
        { description: `Delete a ${r.label} by id.`, input: object({ id: number() }), approval: always() },
        async ({ fetch }, { id }) =>
          decodeJson(
            await fetch(url(account, `${r.path}/${id}`), { method: "DELETE", signal, headers: { Accept: "application/json" } }),
            json(),
          ),
      );
    }
  }
  return router(tools as never);
};

export default defineApp({ user: { accounts: { upsales: upsales.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.upsales ?? [], (account) => upsalesTools(account, signal), { signal }), {
    title: "Upsales",
    description:
      "Upsales CRM: companies, contacts, users, opportunities and orders, agreements, activities, appointments, products, projects and tasks.",
    icons,
  }),
}));
