import {
  accountRouter,
  array,
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

const origin = "https://system.firmao.pl";

type Fields = { organizationId: string; login: string; password: string };

const firmao = defineProvider({
  name: "Firmao",
  hosts: ["system.firmao.pl"],
  auth: {
    // Company > Settings > API in Firmao: enable the API, copy the login, generate a password.
    apiKey: secrets({
      label: "API login and password",
      fields: object({
        organizationId: string({ minLength: 1 }),
        login: string({ minLength: 1 }),
        password: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base(account.fields)}/customers?start=0&limit=1`, {
      signal,
      headers: headers(account.fields),
    });
    await decodeJson(response, object({ data: array(json()) }));
    return { accountInfo: { externalId: account.fields.organizationId, displayName: account.fields.organizationId } };
  },
});

function base(fields: Fields) {
  return `${origin}/${encodeURIComponent(fields.organizationId)}/svc/v1`;
}

function headers(fields: Fields) {
  return { Authorization: `Basic ${btoa(`${fields.login}:${fields.password}`)}` };
}

const resources: {
  path: string;
  key: string;
  label: string;
  create?: boolean;
  update?: boolean;
  list?: boolean;
}[] = [
  { path: "customers", key: "customers", label: "customers (contractors)", create: true, update: true },
  { path: "contacts", key: "contacts", label: "contact persons", create: true, update: true },
  { path: "customergroups", key: "customerGroups", label: "customer groups" },
  { path: "salesnotes", key: "salesNotes", label: "sales notes", create: true, update: true },
  { path: "projects", key: "projects", label: "projects", create: true, update: true },
  { path: "tasks", key: "tasks", label: "tasks", create: true, update: true },
  { path: "products", key: "products", label: "products and services", create: true, update: true },
  { path: "transactions", key: "transactions", label: "transactions (invoices, receipts, proformas, corrections)", create: true, update: true },
  { path: "offers", key: "offers", label: "offers and orders", create: true, update: true },
  { path: "agreements", key: "agreements", label: "agreements", create: true, update: true },
  { path: "storagedocs", key: "storageDocuments", label: "warehouse documents", update: true },
  { path: "documents", key: "documents", label: "files" },
  { path: "mails", key: "mails", label: "emails" },
  { path: "timeentries", key: "timeEntries", label: "work time entries", create: true, update: true },
  { path: "salesopportunities", key: "salesOpportunities", label: "sales opportunities", create: true, update: true },
  { path: "transactionentries", key: "transactionEntries", label: "transaction entries (invoice lines; filter with {\"transaction(eq)\": \"<transactionId>\"})" },
  { path: "invoicenumbers", key: "numberingSeries", label: "invoice numbering series" },
];

type Params = Record<string, unknown>;
// Operations have differing input types; the router only needs the common shape.
// biome-ignore lint/suspicious/noExplicitAny: heterogeneous operations
type Tool = any;

function caller(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base(fields)}/${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        ...headers(fields),
        ...(body === undefined ? {} : { "Content-Type": "application/json; charset=UTF-8" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 429) {
      throw new Error("Firmao rate limit exceeded (60 requests per minute, at most 5 concurrent): HTTP 429. Wait and retry.");
    }
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  return call;
}

function build(fields: Fields, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = caller(fields, fetcher, signal);
  const groups: Record<string, Record<string, Tool>> = {};
  for (const r of resources) {
    const group: Record<string, Tool> = (groups[r.key] = {});
    group.list = query(
      {
        description: `List ${r.label}. Paged with start and limit; the response has data and totalSize (-1 means at least limit results, probably more). filters maps "field(op)" to a value, where op is contains, notContains, eq, ne, in, notin (values separated by ;), gt, ngt, ge, nge, lt, nlt, le, nle; for example {"name(contains)": "acme"}. dataFormat MEDIUM returns full objects.`,
        input: object({
          start: number().default(0),
          limit: number().default(50),
          sort: string().optional(),
          dir: string().optional(),
          dataFormat: string().optional(),
          filters: record(string()).optional(),
        }),
      },
      async (_ctx, { filters, ...rest }) => call("GET", r.path, { ...rest, ...(filters ?? {}) }),
    );
    group.get = query(
      { description: `Get one of the ${r.label} by id.`, input: object({ id: string({ minLength: 1 }) }) },
      async (_ctx, { id }) => {
        const result = (await call("GET", r.path, { "id(eq)": id, dataFormat: "MEDIUM" })) as { data?: unknown[] };
        return result.data?.[0] ?? null;
      },
    );
    if (r.create) {
      group.create = mutation(
        {
          description: `Create one of the ${r.label}. body is the JSON object, with dotted keys for nested fields (for example "correspondenceAddress.city") and "customFields.customN" for custom fields. References to other objects are ids or {id} objects. Returns a changelog containing the new objectId.`,
          input: object({ body: record(json()) }),
        },
        async (_ctx, { body }) => call("POST", r.path, {}, body),
      );
    }
    if (r.update) {
      group.update = mutation(
        {
          description: `Update one of the ${r.label} by id. body holds only the fields to change. Most objects are flagged rather than removed: send {"deleted": true} to delete and {"deleted": false} to restore. Changing one field per request is the best tested.`,
          input: object({ id: string({ minLength: 1 }), body: record(json()) }),
        },
        async (_ctx, { id, body }) => call("PUT", `${r.path}/${encodeURIComponent(id)}`, {}, body),
      );
    }
  }
  groups.numberingSeries!.next = query(
    {
      description:
        "Get the next document number of a numbering series. objectClass is transaction, agreement, offer or storagedoc; type is invoice, receipt, proforma, correction, bill, invoicemargin, advance_invoice, agreement, offer, order, outside_income, outside_release, inside_release, inside_income or warehouse_transfer; mode is SALE or PURCHASE; id is a series id from numberingSeries.list.",
      input: object({
        objectClass: string({ minLength: 1 }),
        type: string({ minLength: 1 }),
        mode: string({ minLength: 1 }),
        id: string({ minLength: 1 }),
      }),
    },
    async (_ctx, args) => call("GET", "invoicenumbers/next", args),
  );
  const other = {
    deleteObject: mutation(
      {
        description:
          "Permanently delete an object that has no deleted flag (reminders, attachments, transaction entries) with HTTP DELETE. resource is the API path segment, for example transactionentries. This cannot be undone; for other objects use update with {\"deleted\": true}.",
        input: object({ resource: string({ minLength: 1 }), id: string({ minLength: 1 }) }),
      },
      async (_ctx, { resource, id }) => call("DELETE", `${encodeURIComponent(resource)}/${encodeURIComponent(id)}`),
    ),
  };
  return router({
    ...Object.fromEntries(Object.entries(groups).map(([key, tools]) => [key, router(tools)])),
    ...other,
  });
}

export default defineApp(
  { user: { accounts: { firmao: firmao.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.firmao ?? [],
        (account) =>
          withApprovals(build(account.fields, fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Firmao",
        description:
          "Firmao CRM and ERP: customers, contacts, projects, tasks, products, invoices, offers, agreements, sales notes, warehouse documents and time entries.",
        instructions:
          "Firmao allows 60 requests per minute and 5 concurrent requests (HTTP 429 beyond that). Every request goes to the organization named in the account. Ids are numeric. Lists page with start and limit; filter with filters like {\"name(contains)\": \"acme\"}. Most objects are deleted by update with {\"deleted\": true}.",
        icons,
      },
    ),
  }),
);
