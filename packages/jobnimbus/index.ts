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

const base = "https://app.jobnimbus.com";

const jobnimbus = defineProvider({
  name: "JobNimbus",
  hosts: ["app.jobnimbus.com"],
  auth: {
    // JobNimbus offers API keys only (Settings, API); there is no OAuth for customers.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/api1/account/users`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const idInput = object({ jnid: string({ minLength: 1 }) });
const bodyInput = object({ body: record(json()) });
const updateInput = object({ jnid: string({ minLength: 1 }), body: record(json()) });

const listParams = object({ query: record(json()).optional() });

function build(call: Call) {
  const list = (path: string, description: string) =>
    query(
      {
        description: `${description} Pass query parameters in query: size (1-1000, default 1000), from (zero-based offset), sort_field, sort_direction (asc or desc), fields (comma-separated), filter (an Elasticsearch-style object such as {"must":[{"term":{"status_name":"Lead"}}]}). Results are under "results".`,
        input: listParams,
      },
      async (_ctx, input: Params) => call("GET", path, (input.query as Params | undefined) ?? {}),
    );
  const get = (path: string, noun: string) =>
    query({ description: `Retrieve one ${noun} by jnid.`, input: idInput }, async (_ctx, input: Params) =>
      call("GET", `${path}/${encodeURIComponent(String(input.jnid))}`),
    );
  const create = (path: string, noun: string, hint: string) =>
    mutation({ description: `Create ${noun}. body holds the fields. ${hint}`, input: bodyInput }, async (_ctx, input: Params) =>
      call("POST", path, {}, input.body as Params),
    );
  const update = (path: string, noun: string) =>
    mutation(
      { description: `Update ${noun}. body holds only the fields to change.`, input: updateInput },
      async (_ctx, input: Params) => call("PUT", `${path}/${encodeURIComponent(String(input.jnid))}`, {}, input.body as Params),
    );
  // JobNimbus has no DELETE: records are archived by setting is_active to false.
  const archive = (path: string, noun: string) =>
    mutation(
      { description: `Archive ${noun} (JobNimbus has no hard delete; this sets is_active to false).`, input: idInput },
      async (_ctx, input: Params) =>
        call("PUT", `${path}/${encodeURIComponent(String(input.jnid))}`, {}, { is_active: false }),
    );
  const crud = (path: string, noun: string, plural: string, hint = "") => ({
    list: list(path, `List ${plural}.`),
    get: get(path, noun),
    create: create(path, `a ${noun}`, hint),
    update: update(path, `a ${noun}`),
    archive: archive(path, `a ${noun}`),
  });
  const setup = (segment: string, noun: string, hint: string) =>
    create(`/api1/account/${segment}`, `a ${noun}`, hint);

  return router({
    contacts: router(
      crud("/api1/contacts", "contact", "contacts", "Typically first_name, last_name, email, home_phone, mobile_phone, address_line1, city, state_text, zip, status_name, record_type_name, source_name."),
      { title: "Contacts", description: "People and companies, including leads and customers." },
    ),
    jobs: router(
      crud("/api1/jobs", "job", "jobs", "Typically name, related (array of {id} for contacts), status_name, record_type_name, address_line1, city, state_text, zip, description, sales_rep."),
      { title: "Jobs", description: "Jobs and projects linked to contacts." },
    ),
    tasks: router(
      crud("/api1/tasks", "task", "tasks", "Typically title, description, date_start, date_end, record_type_name, related (array of {id}), owners (array of {id})."),
      { title: "Tasks", description: "Tasks and appointments." },
    ),
    activities: router(
      {
        list: list("/api1/activities", "List activities (notes, calls, emails, status changes)."),
        get: get("/api1/activities", "activity"),
        create: create("/api1/activities", "an activity (for example a note)", "Typically note, record_type_name, primary ({id}), related (array of {id}), date_start."),
      },
      { title: "Activities", description: "Notes and activity history on contacts and jobs." },
    ),
    estimates: router(
      crud("/api1/v2/estimates", "estimate", "estimates", "Typically related (array of {id}), items (line items), date_created, status_name."),
      { title: "Estimates", description: "Estimates and proposals." },
    ),
    invoices: router(
      crud("/api1/v2/invoices", "invoice", "invoices", "Typically related (array of {id}), items (line items), date_created, due_date."),
      { title: "Invoices", description: "Customer invoices." },
    ),
    workOrders: router(
      crud("/api1/v2/workorders", "work order", "work orders", "Typically related (array of {id}), items, status_name."),
      { title: "Work orders", description: "Work orders for crews and subcontractors." },
    ),
    materialOrders: router(
      crud("/api1/v2/materialorders", "material order", "material orders", "Typically related (array of {id}), items, status_name, delivery details."),
      { title: "Material orders", description: "Material orders for jobs." },
    ),
    products: router(
      crud("/api1/v2/products", "product", "products", "Typically name, sku, description, uom, cost, price."),
      { title: "Products", description: "Product and service catalog." },
    ),
    payments: router(
      {
        list: list("/api1/payments", "List payments."),
        create: mutation(
          { description: "Create a payment. body holds the fields, typically related (array of {id} for the invoice or job), amount, method, date_payment.", input: bodyInput },
          async (_ctx, input: Params) => call("POST", "/api2/v2/payments", {}, input.body as Params),
        ),
      },
      { title: "Payments", description: "Payments recorded against invoices and jobs." },
    ),
    budgets: router(
      { list: list("/api1/budgets", "List budgets.") },
      { title: "Budgets", description: "Job budgets." },
    ),
    files: router(
      {
        list: list("/api1/files", "List file attachment records (metadata). Filter by related record with filter."),
      },
      { title: "Files", description: "File attachment metadata. Uploads are not wrapped." },
    ),
    account: router(
      {
        settings: query(
          { description: "Retrieve account settings: workflows and statuses, lead sources, custom fields, file/task/activity types and locations. Pass field=groups for group information.", input: object({ field: string().optional() }) },
          async (_ctx, input: Params) => call("GET", "/api1/account/settings", input.field ? { field: input.field } : {}),
        ),
        users: query({ description: "List users (team members) in the account.", input: object({}) }, async () =>
          call("GET", "/api1/account/users"),
        ),
        unitsOfMeasure: query({ description: "List units of measure.", input: object({}) }, async () =>
          call("GET", "/api1/utility/uoms"),
        ),
        createWorkflow: setup("workflow", "workflow", "Typically name, object_type (contact, job or workorder)."),
        createStatus: mutation(
          { description: "Create a status within a workflow. body typically has name.", input: object({ workflowId: string({ minLength: 1 }), body: record(json()) }) },
          async (_ctx, input: Params) =>
            call("POST", `/api1/account/workflow/${encodeURIComponent(String(input.workflowId))}/status`, {}, input.body as Params),
        ),
        createLeadSource: setup("leadsource", "lead source", "Typically name."),
        createCustomField: setup("customfield", "custom field", "Typically name, type, object_type."),
        createFileType: setup("filetype", "file type", "Typically name."),
        createTaskType: setup("tasktype", "task type", "Typically name."),
        createActivityType: setup("activitytype", "activity type", "Typically name."),
        createLocation: setup("location", "location", "Typically name and address fields."),
      },
      { title: "Account", description: "Account settings, users and configuration lists." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { jobnimbus: jobnimbus.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jobnimbus ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "JobNimbus",
        description:
          "JobNimbus CRM for contractors: contacts, jobs, tasks, activities, estimates, invoices, work and material orders, products, payments and account settings. Records are keyed by jnid; list tools take size, from, sort and filter in query.",
        icons,
      },
    ),
  }),
);
