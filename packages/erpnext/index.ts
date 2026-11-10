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
  plain,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// ERPNext is self-hosted or on Frappe Cloud, so the site URL is part of the account. The provider
// declares no `hosts` (self-hosted sites have arbitrary origins and framework host patterns cannot
// cover them), so app code holds the raw key and secret; they are only sent to siteOrigin(site).
const erpnext = defineProvider({
  name: "ERPNext",
  auth: {
    apiKey: secrets({
      label: "API key and secret",
      fields: object({
        site: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
        apiSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = siteOrigin(account.fields.site);
    const response = await fetch(`${origin}/api/method/frappe.auth.get_logged_user`, {
      signal,
      headers: authHeaders(account.fields.apiKey, account.fields.apiSecret),
    });
    const { message } = await decodeJson(response, object({ message: string() }));
    return { accountInfo: { externalId: `${origin}:${message}`, displayName: message } };
  },
});

// One place that validates the stored site; every use (health and tool routing) goes through it.
function siteOrigin(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your ERPNext site URL, for example https://mycompany.erpnext.com.");
  }
  if (url.protocol !== "https:") throw new Error("The ERPNext site must use https.");
  return url.origin;
}

function authHeaders(key: string, secret: string) {
  return { Authorization: `token ${key}:${secret}`, Accept: "application/json" };
}

type Params = Record<string, unknown>;

// Frappe takes list parameters as JSON-encoded query values.
function listQuery(args: Params): Params {
  const out: Params = {};
  for (const name of ["fields", "filters", "or_filters"]) {
    if (args[name] !== undefined) out[name] = JSON.stringify(args[name]);
  }
  for (const name of ["order_by", "limit_start", "limit_page_length", "group_by"]) {
    if (args[name] !== undefined) out[name] = args[name];
  }
  return out;
}

const listInput = {
  fields: array(string()).optional(),
  filters: json().optional(),
  or_filters: json().optional(),
  order_by: string().optional(),
  group_by: string().optional(),
  limit_start: number().optional(),
  limit_page_length: number().optional(),
};

const listHelp =
  " fields is a list of field names (default: name only), filters a list like [[\"status\",\"=\",\"Open\"]] or an object {\"status\":\"Open\"}, order_by like \"modified desc\". limit_page_length defaults to 20; pass 0 for all rows.";

// Common ERPNext doctypes, exposed as typed groups. Any other doctype works through `documents`.
const doctypes: [group: string, doctype: string][] = [
  ["customers", "Customer"],
  ["suppliers", "Supplier"],
  ["contacts", "Contact"],
  ["addresses", "Address"],
  ["leads", "Lead"],
  ["opportunities", "Opportunity"],
  ["items", "Item"],
  ["itemPrices", "Item Price"],
  ["warehouses", "Warehouse"],
  ["quotations", "Quotation"],
  ["salesOrders", "Sales Order"],
  ["deliveryNotes", "Delivery Note"],
  ["salesInvoices", "Sales Invoice"],
  ["purchaseOrders", "Purchase Order"],
  ["purchaseReceipts", "Purchase Receipt"],
  ["purchaseInvoices", "Purchase Invoice"],
  ["paymentEntries", "Payment Entry"],
  ["journalEntries", "Journal Entry"],
  ["stockEntries", "Stock Entry"],
  ["accounts", "Account"],
  ["companies", "Company"],
  ["employees", "Employee"],
  ["projects", "Project"],
  ["tasks", "Task"],
  ["timesheets", "Timesheet"],
  ["issues", "Issue"],
  ["bom", "BOM"],
  ["workOrders", "Work Order"],
];

const segment = (value: unknown) => encodeURIComponent(String(value));

function build(site: string, key: string, secret: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const origin = siteOrigin(site);
  const call = async (method: string, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${origin}${path}`);
    for (const [name, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) url.searchParams.set(name, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        ...authHeaders(key, secret),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };

  const resourceTools = (doctype: (args: Params) => string, withDoctype: boolean, label: string) => {
    const dt: Record<string, ReturnType<typeof string>> = withDoctype ? { doctype: string() } : {};
    return {
      list: query(
        { description: `List ${label}.${listHelp}`, input: object({ ...dt, ...listInput }) },
        async (_ctx, args: Params) => call("GET", `/api/resource/${segment(doctype(args))}`, listQuery(args)),
      ),
      get: query(
        { description: `Get one ${label} by name (its id) with all fields and child tables.`, input: object({ ...dt, name: string() }) },
        async (_ctx, args: Params) => call("GET", `/api/resource/${segment(doctype(args))}/${segment(args.name)}`),
      ),
      create: mutation(
        { description: `Create a ${label}. Pass the field values as data, including child tables as lists of row objects.`, input: object({ ...dt, data: record(json()) }) },
        async (_ctx, args: Params) => call("POST", `/api/resource/${segment(doctype(args))}`, {}, args.data as Params),
      ),
      update: mutation(
        { description: `Update a ${label}. Only the fields in data change; to change a child table, send the whole list of rows.`, input: object({ ...dt, name: string(), data: record(json()) }) },
        async (_ctx, args: Params) => call("PUT", `/api/resource/${segment(doctype(args))}/${segment(args.name)}`, {}, args.data as Params),
      ),
      delete: mutation(
        { description: `Delete a ${label}.`, input: object({ ...dt, name: string() }) },
        async (_ctx, args: Params) => call("DELETE", `/api/resource/${segment(doctype(args))}/${segment(args.name)}`),
      ),
    };
  };

  const typed = Object.fromEntries(
    doctypes.map(([group, doctype]) => [group, router(resourceTools(() => doctype, false, `${doctype} document`))]),
  );

  return router({
    ...typed,
    documents: router({
      ...resourceTools((args) => String(args.doctype), true, "document of any doctype"),
      count: query(
        { description: "Count documents of a doctype that match filters.", input: object({ doctype: string(), filters: json().optional() }) },
        async (_ctx, args: Params) =>
          call("GET", "/api/method/frappe.client.get_count", {
            doctype: args.doctype,
            ...(args.filters === undefined ? {} : { filters: JSON.stringify(args.filters) }),
          }),
      ),
      getValue: query(
        { description: "Read field values from the first document matching filters (or one document by name as filters).", input: object({ doctype: string(), fieldname: array(string()), filters: json() }) },
        async (_ctx, args: Params) =>
          call("GET", "/api/method/frappe.client.get_value", {
            doctype: args.doctype,
            fieldname: JSON.stringify(args.fieldname),
            filters: JSON.stringify(args.filters),
          }),
      ),
      searchLink: query(
        { description: "Search documents of a doctype by text, as the link-field dropdowns do. Returns value and description.", input: object({ doctype: string(), txt: string(), filters: json().optional(), page_length: number().optional() }) },
        async (_ctx, args: Params) =>
          call("GET", "/api/method/frappe.desk.search.search_link", {
            doctype: args.doctype,
            txt: args.txt,
            ...(args.filters === undefined ? {} : { filters: JSON.stringify(args.filters) }),
            ...(args.page_length === undefined ? {} : { page_length: args.page_length }),
          }),
      ),
      submit: mutation(
        { description: "Submit a submittable document (invoice, order, entry...) so it becomes final. Pass the full document, as returned by get, as doc.", input: object({ doc: record(json()) }) },
        async (_ctx, args: Params) => call("POST", "/api/method/frappe.client.submit", {}, { doc: JSON.stringify(args.doc) }),
      ),
      cancel: mutation(
        { description: "Cancel a submitted document.", input: object({ doctype: string(), name: string() }) },
        async (_ctx, args: Params) => call("POST", "/api/method/frappe.client.cancel", {}, { doctype: args.doctype, name: args.name }),
      ),
    }),
    meta: router({
      getDoctype: query(
        { description: "Describe a doctype: its fields, types, options, child tables and whether it is submittable. Use it before creating documents.", input: object({ doctype: string() }) },
        async (_ctx, args: Params) => call("GET", "/api/method/frappe.desk.form.load.getdoctype", { doctype: args.doctype }),
      ),
      listDoctypes: query(
        { description: "List the doctypes on the site (names and modules).", input: object({ module: string().optional(), limit_page_length: number().optional() }) },
        async (_ctx, args: Params) =>
          call("GET", "/api/resource/DocType", {
            fields: JSON.stringify(["name", "module", "istable", "issingle", "is_submittable"]),
            ...(args.module === undefined ? {} : { filters: JSON.stringify({ module: args.module }) }),
            limit_page_length: args.limit_page_length ?? 0,
          }),
      ),
      loggedUser: query(
        { description: "Return the user the API key belongs to.", input: object({}) },
        async () => call("GET", "/api/method/frappe.auth.get_logged_user"),
      ),
      runReport: query(
        { description: "Run a script or query report (for example \"General Ledger\", \"Stock Balance\", \"Accounts Receivable\") with a filters object.", input: object({ report_name: string(), filters: record(json()).optional() }) },
        async (_ctx, args: Params) =>
          call("GET", "/api/method/frappe.desk.query_report.run", {
            report_name: args.report_name,
            filters: JSON.stringify(args.filters ?? {}),
          }),
      ),
      callMethod: mutation(
        { description: "Call any whitelisted server method by dotted path (for example erpnext.stock.utils.get_stock_balance) with a JSON body of arguments. May change data.", input: object({ method: string(), args: record(json()).optional() }) },
        async (_ctx, args: Params) => {
          const method = args.method as string;
          if (!/^[A-Za-z_][\w.]*$/.test(method) || method.includes("..")) {
            throw new Error("method must be a dotted Python path such as erpnext.stock.utils.get_stock_balance.");
          }
          return call("POST", `/api/method/${method}`, {}, (args.args as Params | undefined) ?? {});
        },
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { erpnext: erpnext.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.erpnext ?? [],
        (account) =>
          withApprovals(
            build(account.fields.site, account.fields.apiKey, account.fields.apiSecret, fetch, signal),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "ERPNext",
        description:
          "ERPNext (Frappe) customers, suppliers, items, quotations, sales and purchase documents, payments, stock, employees, projects and any other doctype, plus reports.",
        instructions:
          "Documents are identified by name (their id, for example SINV-00001). Use the typed groups (customers, items, salesInvoices...) for common doctypes and `documents` for any other doctype; meta.getDoctype shows a doctype's fields. Submittable documents are created as drafts; documents.submit finalizes them. Lists return only `name` unless fields is given.",
        icons,
      },
    ),
  }),
);
