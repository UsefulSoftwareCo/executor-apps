import {
  accountRouter,
  base64,
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


const baseUrl = (subdomain: string) => `https://${subdomain}.clientary.com/api/v2`;

const clientary = defineProvider({
  name: "Clientary",
  hosts: ["*.clientary.com"],
  auth: {
    // The API takes the user's API token as both the HTTP Basic username and password.
    apiToken: secrets({
      label: "API token",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("authorization", t`Basic ${base64(t`${token}:${token}`)}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${baseUrl(account.fields.subdomain)}/staff`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    // The staff list is always present; only its shape is checked.
    await decodeJson(response, object({ staff: json() }));
    return { accountInfo: { externalId: account.fields.subdomain, displayName: account.fields.subdomain } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string, required = false): Field => [name, "string", required, "query"];
const n = (name: string): Field => [name, "number", false, "query"];

const paging = [n("page")];
const pagingSized = [n("page"), n("page_size")];
const since = [s("updated_since")];
const dates = [s("from_date"), s("to_date")];
const search = [s("q"), s("sort")];

// A write sends `{ [wrapper]: body }`; "*" sends the body as it is.
type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  description: string,
  fields: Field[],
  wrapper?: string,
];

const note = "body holds the attributes exactly as Clientary documents them (https://www.clientary.com/api).";
const listNote = "Returns page_count, page_size, total_count and the items; use page to move through results.";
const unpagedNote = "Returns the items; the vendor documents no paging input for this endpoint.";

const rows: Row[] = [
  // Clients
  ["clients", "list", "GET", "/clients", `List clients. filter is archived for archived clients. ${listNote}`, [...search, s("filter"), ...since, ...paging]],
  ["clients", "get", "GET", "/clients/{id}", "Retrieve a client.", []],
  ["clients", "create", "POST", "/clients", `Create a client (name is required, number must be unique). ${note}`, [], "client"],
  ["clients", "update", "PUT", "/clients/{id}", `Update a client. ${note}`, [], "client"],
  ["clients", "delete", "DELETE", "/clients/{id}", "Delete a client.", []],

  // Contacts
  ["contacts", "list", "GET", "/contacts", `List contacts across all clients. ${listNote}`, [...search, ...since, ...pagingSized]],
  ["contacts", "listForClient", "GET", "/clients/{client_id}/contacts", `List a client's contacts. ${listNote}`, [...search, ...pagingSized]],
  ["contacts", "get", "GET", "/contacts/{id}", "Retrieve a contact.", []],
  ["contacts", "create", "POST", "/clients/{client_id}/contacts", `Create a contact on a client (name and email are required, otherwise 422). ${note}`, [], "client_user"],
  ["contacts", "update", "PUT", "/contacts/{id}", `Update a contact. ${note}`, [], "client_user"],
  ["contacts", "delete", "DELETE", "/contacts/{id}", "Delete a contact.", []],

  // Leads
  ["leads", "list", "GET", "/leads", `List leads. filter is closed for closed leads. ${listNote}`, [...search, s("filter"), ...paging]],
  ["leads", "get", "GET", "/leads/{id}", "Retrieve a lead.", []],
  ["leads", "create", "POST", "/leads", `Create a lead. ${note}`, [], "lead"],
  ["leads", "update", "PUT", "/leads/{id}", `Update a lead. ${note}`, [], "lead"],
  ["leads", "delete", "DELETE", "/leads/{id}", "Delete a lead.", []],

  // Projects
  ["projects", "list", "GET", "/projects", `List projects. filter is closed for closed projects. ${listNote}`, [...search, s("filter"), ...pagingSized]],
  ["projects", "listForClient", "GET", "/clients/{client_id}/projects", `List a client's projects. ${listNote}`, [...search, s("filter"), ...paging]],
  ["projects", "get", "GET", "/projects/{id}", "Retrieve a project.", []],
  ["projects", "create", "POST", "/projects", `Create a project (name and rate are required, number must be unique). ${note}`, [], "project"],
  ["projects", "update", "PUT", "/projects/{id}", `Update a project. ${note}`, [], "project"],
  ["projects", "delete", "DELETE", "/projects/{id}", "Delete a project.", []],

  // Tasks
  ["tasks", "list", "GET", "/tasks", `List tasks. status is open or done; sort is created_at; user_id limits to one user. ${unpagedNote}`, [s("status"), n("user_id"), s("sort")]],
  ["tasks", "listForProject", "GET", "/projects/{project_id}/tasks", `List a project's tasks (status is open or done). ${unpagedNote}`, [s("status"), n("user_id"), s("sort")]],
  ["tasks", "listForClient", "GET", "/clients/{client_id}/tasks", `List a client's tasks (status is open or done). ${unpagedNote}`, [s("status"), n("user_id"), s("sort")]],
  ["tasks", "get", "GET", "/tasks/{id}", "Retrieve a task.", []],
  ["tasks", "create", "POST", "/tasks", `Create a task. ${note}`, [], "task"],
  ["tasks", "update", "PUT", "/tasks/{id}", `Update a task. ${note}`, [], "task"],
  ["tasks", "delete", "DELETE", "/tasks/{id}", "Delete a task.", []],

  // Hours (time tracking)
  ["hours", "list", "GET", "/projects/{project_id}/hours", `List the hours tracked on a project. filter is unbilled or billed. ${unpagedNote}`, [s("filter")]],
  ["hours", "get", "GET", "/hours/{id}", "Retrieve a time entry.", []],
  ["hours", "create", "POST", "/projects/{project_id}/hours", `Track hours on a project; they are logged under the staff user who owns the API token. hours and title are required; the wrapper key is project_item, not hours. ${note}`, [], "project_item"],
  ["hours", "update", "PUT", "/hours/{id}", `Update a time entry (the wrapper key is project_item). ${note}`, [], "project_item"],
  ["hours", "delete", "DELETE", "/hours/{id}", "Delete a time entry.", []],

  // Invoices
  ["invoices", "list", "GET", "/invoices", `List invoices. status is for example open; q searches number, title, client name or PO. ${listNote}`, [...search, s("status"), ...dates, ...since, ...paging]],
  ["invoices", "listForClient", "GET", "/clients/{client_id}/invoices", `List a client's invoices. ${listNote}`, [...search, s("status"), ...dates, ...paging]],
  ["invoices", "listForProject", "GET", "/projects/{project_id}/invoices", `List a project's invoices. ${listNote}`, [...search, s("status"), ...dates, ...paging]],
  ["invoices", "listForRecurring", "GET", "/recurring/{id}/invoices", `List the invoices generated by a recurring invoice. ${listNote}`, [...paging]],
  ["invoices", "get", "GET", "/invoices/{id}", "Retrieve an invoice with its items, url, client_view_url and pdf_url.", []],
  ["invoices", "create", "POST", "/invoices", `Create an invoice (date, currency_code and due_date are required; line items go in invoice_item_attributes with title, quantity and price). ${note}`, [], "invoice"],
  ["invoices", "createForClient", "POST", "/clients/{client_id}/invoices", `Create an invoice for a client. ${note}`, [], "invoice"],
  ["invoices", "update", "PUT", "/invoices/{id}", `Update an invoice. ${note}`, [], "invoice"],
  ["invoices", "delete", "DELETE", "/invoices/{id}", "Delete an invoice.", []],
  ["invoices", "send", "POST", "/invoices/{id}/messages", "Email an invoice to the client. body is { subject, message }.", [], "*"],

  // Payments
  ["payments", "list", "GET", "/payments", `List payments. ${listNote}`, [s("sort"), ...dates, ...since, ...paging]],
  ["payments", "create", "POST", "/invoices/{invoice_id}/payments", `Record a payment on an invoice. ${note}`, [], "payment"],
  ["payments", "delete", "DELETE", "/invoices/{invoice_id}/payments/{id}", "Delete a payment from an invoice.", []],
  ["paymentProfiles", "list", "GET", "/clients/{client_id}/payment_profiles", "List a client's stored payment profiles.", []],
  ["paymentProfiles", "create", "POST", "/clients/{client_id}/payment_profiles", `Create a payment profile for a client. ${note}`, [], "payment_profile"],
  ["paymentProfiles", "delete", "DELETE", "/clients/{client_id}/payment_profiles/{id}", "Delete a client's payment profile.", []],

  // Estimates
  ["estimates", "list", "GET", "/estimates", `List estimates. filter is for example open. ${listNote}`, [...search, s("filter"), ...dates, ...paging]],
  ["estimates", "listForClient", "GET", "/clients/{client_id}/estimates", `List a client's estimates. ${listNote}`, [...search, s("filter"), ...dates, ...paging]],
  ["estimates", "listForProject", "GET", "/projects/{project_id}/estimates", `List a project's estimates. ${listNote}`, [...search, s("filter"), ...dates, ...paging]],
  ["estimates", "get", "GET", "/estimates/{id}", "Retrieve an estimate with its items.", []],
  ["estimates", "create", "POST", "/estimates", `Create an estimate. ${note}`, [], "estimate"],
  ["estimates", "update", "PUT", "/estimates/{id}", `Update an estimate. ${note}`, [], "estimate"],
  ["estimates", "delete", "DELETE", "/estimates/{id}", "Delete an estimate.", []],
  ["estimates", "send", "POST", "/estimates/{id}/messages", "Email an estimate to the client. body is { subject, message }.", [], "*"],

  // Expenses
  ["expenses", "list", "GET", "/expenses", `List expenses. ${unpagedNote}`, [...search, ...dates]],
  ["expenses", "listForClient", "GET", "/clients/{client_id}/expenses", `List a client's expenses. ${unpagedNote}`, [...search, ...dates]],
  ["expenses", "listForProject", "GET", "/projects/{project_id}/expenses", `List a project's expenses. ${unpagedNote}`, [...search, ...dates]],
  ["expenses", "get", "GET", "/expenses/{id}", "Retrieve an expense.", []],
  ["expenses", "create", "POST", "/expenses", `Create an expense. ${note}`, [], "expense"],
  ["expenses", "update", "PUT", "/expenses/{id}", `Update an expense. ${note}`, [], "expense"],
  ["expenses", "delete", "DELETE", "/expenses/{id}", "Delete an expense.", []],

  // Staff
  ["staff", "list", "GET", "/staff", "List staff users.", []],
  ["staff", "get", "GET", "/staff/{id}", "Retrieve a staff user.", []],
];

type Account = {
  fields: { subdomain: string };
  headers(): Record<string, string>;
  url(input: string): string;
};

function fieldsOf(path: string, extra: Field[], wrapper: string | undefined): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "string", true, "path"]);
  const body: Field[] = wrapper === undefined ? [] : [["body", "json", true, "query"]];
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
  const call = async (
    method: string,
    path: string,
    fields: Field[],
    wrapper: string | undefined,
    input: Record<string, unknown>,
  ) => {
    let target = path;
    const params = new URLSearchParams();
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (name === "body" || value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else params.set(name, String(value));
    }
    const hasBody = wrapper !== undefined && input.body !== undefined;
    const payload = hasBody ? (wrapper === "*" ? input.body : { [wrapper]: input.body }) : undefined;
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
    if (!response.ok) throw new Error(`Clientary answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra, wrapper] of rows) {
    const fields = fieldsOf(path, extra, wrapper);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, wrapper, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { clientary: clientary.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.clientary ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Clientary",
        description:
          "Clientary client management: clients, contacts, leads, projects, tasks, hours, invoices, payments, estimates and expenses.",
        instructions:
          "Writes take a body with the resource's attributes; the tool wraps it in the resource key Clientary expects (for example { client: body }). Most lists are paged through the documented page input (page_size only on contacts and projects); read page_count and total_count in the response. Tasks, hours and expenses lists document no paging input.",
        icons,
      },
    ),
  }),
);
