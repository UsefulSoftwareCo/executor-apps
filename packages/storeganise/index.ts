import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every operator has its own instance: https://<business code>.storeganise.com/api/v1/admin
const baseUrl = (subdomain: string) => `https://${subdomain}.storeganise.com/api/v1/admin`;

const storeganise = defineProvider({
  name: "Storeganise",
  hosts: ["*.storeganise.com"],
  auth: {
    apiKey: secrets({
      label: "Admin API key",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("authorization", t`ApiKey ${token}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${baseUrl(account.fields.subdomain)}/settings`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    // Settings are always an object; only that is checked.
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: account.fields.subdomain, displayName: account.fields.subdomain } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string): Field => [name, "string", false, "query"];
const n = (name: string): Field => [name, "number", false, "query"];

const paging = [n("limit"), n("offset"), s("updatedAfter"), s("ids"), s("search"), s("include"), s("sort")];

type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  description: string,
  fields: Field[],
  hasBody?: boolean,
];

const listNote =
  "limit and offset page through results; updatedAfter (UTC ISO timestamp) does incremental syncs; ids is up to 50 comma-separated ids; include loads related records (keep it for small lists).";
const bodyNote = "body is the JSON object the Storeganise admin API documents for this endpoint (https://<business code>.storeganise.com/api/docs/).";

const rows: Row[] = [
  ["settings", "get", "GET", "/settings", "Retrieve the business settings (cache this; it rarely changes).", []],
  ["sites", "list", "GET", "/sites", `List sites. ${listNote}`, paging],
  ["sites", "get", "GET", "/sites/{siteIdOrCode}", "Retrieve a site by id or code.", [s("include")]],
  ["users", "list", "GET", "/users", `List customers and staff. ${listNote}`, paging],
  ["users", "get", "GET", "/users/{userIdOrEmail}", "Retrieve a user by id or email.", [s("include")]],
  ["users", "create", "POST", "/users", `Create a user. ${bodyNote}`, [], true],
  ["users", "update", "PUT", "/users/{userId}", `Update a user. ${bodyNote}`, [], true],
  ["units", "list", "GET", "/units", `List storage units. ${listNote}`, paging],
  ["units", "get", "GET", "/units/{unitId}", "Retrieve a unit.", [s("include")]],
  ["unitRentals", "list", "GET", "/unit-rentals", `List unit rentals. ${listNote}`, paging],
  ["unitRentals", "get", "GET", "/unit-rentals/{unitRentalId}", "Retrieve a unit rental (include can be unit, owner, customFields).", [s("include")]],
  ["invoices", "list", "GET", "/invoices", `List invoices. ${listNote}`, paging],
  ["invoices", "get", "GET", "/invoices/{invoiceId}", "Retrieve an invoice.", [s("include")]],
  ["invoices", "update", "PUT", "/invoices/{invoiceId}", `Update an invoice, for example to mark it as paid. ${bodyNote}`, [], true],
  [
    "invoices",
    "addPayment",
    "POST",
    "/invoices/{invoiceId}/payments",
    `Add a payment to an invoice. body is for example { type: "manual", amount, method (cash, card, cheque, transfer or other), date (YYYY-MM-DD), notes }.`,
    [],
    true,
  ],
  ["addons", "list", "GET", "/addons", "List the add-ons installed on this account.", []],
  ["addons", "get", "GET", "/addons/{addonId}", "Retrieve an add-on, including its custom fields.", []],
];

type Account = {
  fields: { subdomain: string };
  headers(): Record<string, string>;
  url(input: string): string;
};

function fieldsOf(path: string, extra: Field[], hasBody: boolean): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "string", true, "path"]);
  const body: Field[] = hasBody ? [["body", "json", true, "query"]] : [];
  return [...pathFields, ...extra, ...body];
}

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> =
      type === "number" ? number() : type === "boolean" ? boolean() : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const send = async (method: string, target: string, params: URLSearchParams, payload: unknown) => {
    const hasBody = payload !== undefined;
    const url = `${baseUrl(account.fields.subdomain)}${target}${params.size > 0 ? `?${params.toString()}` : ""}`;
    const response = await fetcher(account.url(url), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(payload) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Storeganise answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra, hasBody = false] of rows) {
    const fields = fieldsOf(path, extra, hasBody);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => {
      let target = path;
      const params = new URLSearchParams();
      for (const [name, , , where] of fields) {
        const value = input[name];
        if (name === "body" || value === undefined || value === null) continue;
        if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
        else params.set(name, String(value));
      }
      return send(method, target, params, hasBody ? input.body : undefined);
    };
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }

  // Escape hatch for admin endpoints without a dedicated tool (jobs, valet orders, billing, ...).
  groups.set("api", {
    get: query(
      {
        description:
          "GET any admin API path relative to /api/v1/admin, for example /jobs. query is an object of query-string values. The per-business docs at https://<business code>.storeganise.com/api/docs/ list the endpoints.",
        input: object({ path: string(), query: json().optional() }),
      },
      (async (_ctx: unknown, input: { path: string; query?: Record<string, unknown> }) => {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(input.query ?? {})) if (v !== undefined && v !== null) params.set(k, String(v));
        return send("GET", normalize(input.path), params, undefined);
      }) as never,
    ),
    write: mutation(
      {
        description:
          "POST, PUT or DELETE any admin API path relative to /api/v1/admin. body is the JSON payload (omit for DELETE).",
        input: object({ method: string(), path: string(), body: json().optional() }),
      },
      (async (_ctx: unknown, input: { method: string; path: string; body?: unknown }) => {
        const method = input.method.toUpperCase();
        if (!["POST", "PUT", "DELETE"].includes(method)) throw new Error("method must be POST, PUT or DELETE");
        return send(method, normalize(input.path), new URLSearchParams(), input.body);
      }) as never,
    ),
  });

  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

function normalize(path: string): string {
  if (path.includes("..") || path.includes("://") || path.includes("?")) throw new Error("path must be a plain admin API path");
  return path.startsWith("/") ? path : `/${path}`;
}

export default defineApp(
  { user: { accounts: { storeganise: storeganise.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.storeganise ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Storeganise",
        description: "Storeganise self-storage management: users, units, unit rentals, invoices, payments, sites and add-ons.",
        instructions:
          "Connect with the business code (the part before .storeganise.com) and an admin API key. Lists page with limit and offset; use updatedAfter for incremental syncs. Request endpoints one after another, not in parallel. api.get and api.write reach any other admin endpoint.",
        icons,
      },
    ),
  }),
);
