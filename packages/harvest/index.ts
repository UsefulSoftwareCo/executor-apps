import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.harvestapp.com/v2";
const accountsUrl = "https://id.getharvest.com/api/v2/accounts";
// Harvest rejects requests without a User-Agent.
const userAgent = "Executor (https://executor.sh)";

const Me = object({ id: number(), first_name: string(), last_name: string(), email: string() });
const Accounts = object({ accounts: array(object({ id: number(), product: string() })) });

const harvest = defineProvider({
  name: "Harvest",
  hosts: ["api.harvestapp.com", "id.getharvest.com"],
  auth: {
    token: secrets({
      label: "Personal access token",
      fields: object({ token: string({ minLength: 1 }), accountId: string({ minLength: 1 }) }),
    }),
    // Harvest offers no client registration: the connect page asks for an OAuth2 application's client.
    // Harvest OAuth2 applications have no scopes; the token carries the user's own permissions.
    oauth: oauth2({
      authorizationUrl: "https://id.getharvest.com/oauth2/authorize",
      tokenUrl: "https://id.getharvest.com/api/v2/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const { token, accountId } = await credentials(account, fetch, signal);
    const response = await fetch(`${api}/users/me`, { signal, headers: headers(token, accountId) });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: String(me.id),
        displayName: `${me.first_name} ${me.last_name}`,
        email: me.email,
      },
    };
  },
});

type Account =
  | { method: "token"; fields: { token: string; accountId: string } }
  | { method: "oauth"; fields: { access_token: string } };

function headers(token: string, accountId: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Harvest-Account-Id": accountId,
    "User-Agent": userAgent,
    Accept: "application/json",
  };
}

// A personal access token carries its account id; an OAuth token can reach several accounts and
// Harvest lists them at id.getharvest.com. The account decides which data is read and written, so
// the login must have exactly one Harvest (not Forecast) account; otherwise use a personal access token.
// Endpoints were checked against https://help.getharvest.com/api-v2/ (company, time entries, user
// billable and cost rates, project budget report).
async function credentials(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  if (account.method === "token") return { token: account.fields.token, accountId: account.fields.accountId };
  const token = account.fields.access_token;
  const response = await fetcher(accountsUrl, {
    signal,
    headers: { Authorization: `Bearer ${token}`, "User-Agent": userAgent },
  });
  const { accounts } = await decodeJson(response, Accounts);
  const harvestAccounts = accounts.filter((a) => a.product === "harvest");
  const [found] = harvestAccounts;
  if (harvestAccounts.length !== 1 || !found) {
    throw new Error(
      `This Harvest login has ${harvestAccounts.length} Harvest accounts; connect a personal access token to choose one.`,
    );
  }
  return { token, accountId: String(found.id) };
}

// [name, type, required, where]; path parameters come from {braces} in the path and are always required.
type Type = "string" | "number" | "boolean" | "json";
type Field = [name: string, type: Type, required: boolean, where: "path" | "query" | "body"];

const s = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "number", required, where];
const b = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "boolean", required, where];
const j = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "json", required, where];

const paging = [n("page", "query"), n("per_page", "query")];
const since = [s("updated_since", "query")];
const range = [s("from", "query"), s("to", "query")];

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

const rows: Row[] = [
  // Company
  ["company", "get", "GET", "/company", "The authenticated user's company: name, plan, currency, time format, week start and feature flags.", []],
  ["company", "update", "PATCH", "/company", "Update company settings: wants_timestamp_timers (duration vs start/end time tracking) and weekly_capacity (seconds). Requires an administrator.", [b("wants_timestamp_timers"), n("weekly_capacity")]],

  // Clients
  ["clients", "list", "GET", "/clients", "List clients, newest first. Filter by is_active.", [b("is_active", "query"), ...since, ...paging]],
  ["clients", "get", "GET", "/clients/{clientId}", "Retrieve a client.", []],
  ["clients", "create", "POST", "/clients", "Create a client.", [s("name", "body", true), b("is_active"), s("address"), s("currency")]],
  ["clients", "update", "PATCH", "/clients/{clientId}", "Update a client.", [s("name"), b("is_active"), s("address"), s("currency")]],
  ["clients", "delete", "DELETE", "/clients/{clientId}", "Delete a client (only possible when it has no projects or invoices).", []],

  // Contacts
  ["contacts", "list", "GET", "/contacts", "List client contacts. Filter by client_id.", [n("client_id", "query"), ...since, ...paging]],
  ["contacts", "get", "GET", "/contacts/{contactId}", "Retrieve a client contact.", []],
  ["contacts", "create", "POST", "/contacts", "Create a client contact.", [n("client_id", "body", true), s("first_name", "body", true), s("last_name"), s("title"), s("email"), s("phone_office"), s("phone_mobile"), s("fax")]],
  ["contacts", "update", "PATCH", "/contacts/{contactId}", "Update a client contact.", [n("client_id"), s("title"), s("first_name"), s("last_name"), s("email"), s("phone_office"), s("phone_mobile"), s("fax")]],
  ["contacts", "delete", "DELETE", "/contacts/{contactId}", "Delete a client contact.", []],

  // Projects
  ["projects", "list", "GET", "/projects", "List projects. Filter by is_active or client_id.", [b("is_active", "query"), n("client_id", "query"), ...since, ...paging]],
  ["projects", "get", "GET", "/projects/{projectId}", "Retrieve a project.", []],
  ["projects", "create", "POST", "/projects", "Create a project. bill_by is Project, Tasks, People or none; budget_by is project, project_cost, task, task_fees, person or none.", [n("client_id", "body", true), s("name", "body", true), b("is_billable", "body", true), s("bill_by", "body", true), s("budget_by", "body", true), s("code"), b("is_active"), b("is_fixed_fee"), n("hourly_rate"), n("budget"), b("budget_is_monthly"), b("notify_when_over_budget"), n("over_budget_notification_percentage"), b("show_budget_to_all"), n("cost_budget"), b("cost_budget_include_expenses"), n("fee"), s("notes"), s("starts_on"), s("ends_on")]],
  ["projects", "update", "PATCH", "/projects/{projectId}", "Update a project.", [n("client_id"), s("name"), s("code"), b("is_active"), b("is_billable"), b("is_fixed_fee"), s("bill_by"), n("hourly_rate"), s("budget_by"), n("budget"), b("budget_is_monthly"), b("notify_when_over_budget"), n("over_budget_notification_percentage"), b("show_budget_to_all"), n("cost_budget"), b("cost_budget_include_expenses"), n("fee"), s("notes"), s("starts_on"), s("ends_on")]],
  ["projects", "delete", "DELETE", "/projects/{projectId}", "Delete a project and its time entries and expenses.", []],

  // Project user assignments
  ["userAssignments", "list", "GET", "/user_assignments", "List user assignments across all projects.", [n("user_id", "query"), b("is_active", "query"), ...since, ...paging]],
  ["userAssignments", "listForProject", "GET", "/projects/{projectId}/user_assignments", "List the users assigned to a project.", [n("user_id", "query"), b("is_active", "query"), ...since, ...paging]],
  ["userAssignments", "get", "GET", "/projects/{projectId}/user_assignments/{assignmentId}", "Retrieve a project user assignment.", []],
  ["userAssignments", "create", "POST", "/projects/{projectId}/user_assignments", "Assign a user to a project.", [n("user_id", "body", true), b("is_active"), b("is_project_manager"), b("use_default_rates"), n("hourly_rate"), n("budget")]],
  ["userAssignments", "update", "PATCH", "/projects/{projectId}/user_assignments/{assignmentId}", "Update a project user assignment.", [b("is_active"), b("is_project_manager"), b("use_default_rates"), n("hourly_rate"), n("budget")]],
  ["userAssignments", "delete", "DELETE", "/projects/{projectId}/user_assignments/{assignmentId}", "Remove a user from a project.", []],

  // Project task assignments
  ["taskAssignments", "list", "GET", "/task_assignments", "List task assignments across all projects.", [b("is_active", "query"), ...since, ...paging]],
  ["taskAssignments", "listForProject", "GET", "/projects/{projectId}/task_assignments", "List the tasks assigned to a project.", [b("is_active", "query"), ...since, ...paging]],
  ["taskAssignments", "get", "GET", "/projects/{projectId}/task_assignments/{assignmentId}", "Retrieve a project task assignment.", []],
  ["taskAssignments", "create", "POST", "/projects/{projectId}/task_assignments", "Assign a task to a project.", [n("task_id", "body", true), b("is_active"), b("billable"), n("hourly_rate"), n("budget")]],
  ["taskAssignments", "update", "PATCH", "/projects/{projectId}/task_assignments/{assignmentId}", "Update a project task assignment.", [b("is_active"), b("billable"), n("hourly_rate"), n("budget")]],
  ["taskAssignments", "delete", "DELETE", "/projects/{projectId}/task_assignments/{assignmentId}", "Remove a task from a project.", []],

  // Tasks
  ["tasks", "list", "GET", "/tasks", "List tasks. Filter by is_active.", [b("is_active", "query"), ...since, ...paging]],
  ["tasks", "get", "GET", "/tasks/{taskId}", "Retrieve a task.", []],
  ["tasks", "create", "POST", "/tasks", "Create a task.", [s("name", "body", true), b("billable_by_default"), n("default_hourly_rate"), b("is_default"), b("is_active")]],
  ["tasks", "update", "PATCH", "/tasks/{taskId}", "Update a task.", [s("name"), b("billable_by_default"), n("default_hourly_rate"), b("is_default"), b("is_active")]],
  ["tasks", "delete", "DELETE", "/tasks/{taskId}", "Delete a task (only possible when it has no time entries).", []],

  // Time entries
  ["timeEntries", "list", "GET", "/time_entries", "List time entries, newest first. Filter by user, client, project, task, billed or running state and a from/to date range (YYYY-MM-DD).", [n("user_id", "query"), n("client_id", "query"), n("project_id", "query"), n("task_id", "query"), s("external_reference_id", "query"), b("is_billed", "query"), b("is_running", "query"), ...since, ...range, ...paging]],
  ["timeEntries", "get", "GET", "/time_entries/{timeEntryId}", "Retrieve a time entry.", []],
  ["timeEntries", "create", "POST", "/time_entries", "Create a time entry. Send hours for duration-based accounts, or started_time and ended_time (for example 8:00am) for timestamp accounts; omit both to start a running timer. user_id defaults to the current user.", [n("project_id", "body", true), n("task_id", "body", true), s("spent_date", "body", true), n("user_id"), n("hours"), s("started_time"), s("ended_time"), s("notes"), j("external_reference")]],
  ["timeEntries", "update", "PATCH", "/time_entries/{timeEntryId}", "Update a time entry.", [n("project_id"), n("task_id"), s("spent_date"), n("hours"), s("started_time"), s("ended_time"), s("notes"), j("external_reference")]],
  ["timeEntries", "delete", "DELETE", "/time_entries/{timeEntryId}", "Delete a time entry.", []],
  ["timeEntries", "deleteExternalReference", "DELETE", "/time_entries/{timeEntryId}/external_reference", "Remove the external reference from a time entry.", []],
  ["timeEntries", "restart", "PATCH", "/time_entries/{timeEntryId}/restart", "Restart a stopped time entry's timer.", []],
  ["timeEntries", "stop", "PATCH", "/time_entries/{timeEntryId}/stop", "Stop a running time entry's timer.", []],

  // Users
  ["users", "me", "GET", "/users/me", "The authenticated user.", []],
  ["users", "list", "GET", "/users", "List users. Filter by is_active.", [b("is_active", "query"), ...since, ...paging]],
  ["users", "get", "GET", "/users/{userId}", "Retrieve a user.", []],
  ["users", "create", "POST", "/users", "Create a user and send an invitation.", [s("first_name", "body", true), s("last_name", "body", true), s("email", "body", true), s("timezone"), b("has_access_to_all_future_projects"), b("is_contractor"), b("is_active"), n("weekly_capacity"), n("default_hourly_rate"), n("cost_rate"), j("roles"), j("access_roles")]],
  ["users", "update", "PATCH", "/users/{userId}", "Update a user.", [s("first_name"), s("last_name"), s("email"), s("timezone"), b("has_access_to_all_future_projects"), b("is_contractor"), b("is_active"), n("weekly_capacity"), n("default_hourly_rate"), n("cost_rate"), j("roles"), j("access_roles")]],
  ["users", "delete", "DELETE", "/users/{userId}", "Delete a user (only possible when they have no time entries or expenses).", []],
  ["users", "myProjectAssignments", "GET", "/users/me/project_assignments", "The projects the authenticated user can track time against, with their tasks.", [...paging]],
  ["users", "projectAssignments", "GET", "/users/{userId}/project_assignments", "The projects a user can track time against, with their tasks.", [...paging]],
  ["users", "listBillableRates", "GET", "/users/{userId}/billable_rates", "List a user's billable rates.", [...paging]],
  ["users", "getBillableRate", "GET", "/users/{userId}/billable_rates/{rateId}", "Retrieve a user's billable rate.", []],
  ["users", "createBillableRate", "POST", "/users/{userId}/billable_rates", "Add a billable rate to a user, effective from start_date.", [n("amount", "body", true), s("start_date")]],
  ["users", "listCostRates", "GET", "/users/{userId}/cost_rates", "List a user's cost rates.", [...paging]],
  ["users", "getCostRate", "GET", "/users/{userId}/cost_rates/{rateId}", "Retrieve a user's cost rate.", []],
  ["users", "createCostRate", "POST", "/users/{userId}/cost_rates", "Add a cost rate to a user, effective from start_date.", [n("amount", "body", true), s("start_date")]],
  ["users", "listTeammates", "GET", "/users/{userId}/teammates", "List the people a user manages.", [...paging]],
  ["users", "updateTeammates", "PATCH", "/users/{userId}/teammates", "Replace the people a user manages (teammate_ids).", [j("teammate_ids", "body", true)]],

  // Roles
  ["roles", "list", "GET", "/roles", "List roles.", [...paging]],
  ["roles", "get", "GET", "/roles/{roleId}", "Retrieve a role.", []],
  ["roles", "create", "POST", "/roles", "Create a role.", [s("name", "body", true), j("user_ids")]],
  ["roles", "update", "PATCH", "/roles/{roleId}", "Update a role.", [s("name"), j("user_ids")]],
  ["roles", "delete", "DELETE", "/roles/{roleId}", "Delete a role.", []],

  // Expenses
  ["expenses", "list", "GET", "/expenses", "List expenses. Filter by user, client, project, billed state and a from/to date range (YYYY-MM-DD).", [n("user_id", "query"), n("client_id", "query"), n("project_id", "query"), b("is_billed", "query"), ...since, ...range, ...paging]],
  ["expenses", "get", "GET", "/expenses/{expenseId}", "Retrieve an expense.", []],
  ["expenses", "create", "POST", "/expenses", "Create an expense. Send total_cost, or units for categories priced per unit.", [n("project_id", "body", true), n("expense_category_id", "body", true), s("spent_date", "body", true), n("user_id"), n("units"), n("total_cost"), s("notes"), b("billable")]],
  ["expenses", "update", "PATCH", "/expenses/{expenseId}", "Update an expense.", [n("project_id"), n("expense_category_id"), s("spent_date"), n("units"), n("total_cost"), s("notes"), b("billable"), b("delete_receipt")]],
  ["expenses", "delete", "DELETE", "/expenses/{expenseId}", "Delete an expense.", []],
  ["expenseCategories", "list", "GET", "/expense_categories", "List expense categories.", [b("is_active", "query"), ...since, ...paging]],
  ["expenseCategories", "get", "GET", "/expense_categories/{categoryId}", "Retrieve an expense category.", []],
  ["expenseCategories", "create", "POST", "/expense_categories", "Create an expense category.", [s("name", "body", true), s("unit_name"), n("unit_price"), b("is_active")]],
  ["expenseCategories", "update", "PATCH", "/expense_categories/{categoryId}", "Update an expense category.", [s("name"), s("unit_name"), n("unit_price"), b("is_active")]],
  ["expenseCategories", "delete", "DELETE", "/expense_categories/{categoryId}", "Delete an expense category.", []],

  // Invoices
  ["invoices", "list", "GET", "/invoices", "List invoices. Filter by client, project, state (draft, open, paid, closed) and issue date range (YYYY-MM-DD).", [n("client_id", "query"), n("project_id", "query"), s("state", "query"), ...since, ...range, ...paging]],
  ["invoices", "get", "GET", "/invoices/{invoiceId}", "Retrieve an invoice with its line items.", []],
  ["invoices", "create", "POST", "/invoices", "Create an invoice. line_items is an array of { kind, description, unit_price, quantity, taxed, taxed2, project_id }; line_items_import pulls time and expenses ({ project_ids, time: { summary_type, from, to }, expenses: { summary_type, from, to, attach_receipt } }).", [n("client_id", "body", true), n("retainer_id"), n("estimate_id"), s("number"), s("purchase_order"), n("tax"), n("tax2"), n("discount"), s("subject"), s("notes"), s("currency"), s("issue_date"), s("due_date"), s("payment_term"), j("line_items_import"), j("line_items")]],
  ["invoices", "update", "PATCH", "/invoices/{invoiceId}", "Update an invoice. To change line items send line_items entries with id (update) or id and _destroy true (remove).", [n("client_id"), n("retainer_id"), n("estimate_id"), s("number"), s("purchase_order"), n("tax"), n("tax2"), n("discount"), s("subject"), s("notes"), s("currency"), s("issue_date"), s("due_date"), s("payment_term"), j("line_items")]],
  ["invoices", "delete", "DELETE", "/invoices/{invoiceId}", "Delete an invoice.", []],
  ["invoices", "listMessages", "GET", "/invoices/{invoiceId}/messages", "List messages sent for an invoice.", [...since, ...paging]],
  ["invoices", "sendMessage", "POST", "/invoices/{invoiceId}/messages", "Send an invoice by email, or change its state with event_type (close, draft, re-open, send). recipients is an array of { name, email }.", [j("recipients"), s("subject"), s("body"), b("include_link_to_client_invoice"), b("attach_pdf"), b("send_me_a_copy"), b("thank_you"), s("event_type")]],
  ["invoices", "deleteMessage", "DELETE", "/invoices/{invoiceId}/messages/{messageId}", "Delete an invoice message.", []],
  ["invoices", "listPayments", "GET", "/invoices/{invoiceId}/payments", "List payments recorded on an invoice.", [...since, ...paging]],
  ["invoices", "createPayment", "POST", "/invoices/{invoiceId}/payments", "Record a payment on an invoice.", [n("amount", "body", true), s("paid_at"), s("paid_date"), s("notes")]],
  ["invoices", "deletePayment", "DELETE", "/invoices/{invoiceId}/payments/{paymentId}", "Delete an invoice payment.", []],
  ["invoiceItemCategories", "list", "GET", "/invoice_item_categories", "List invoice item categories.", [...since, ...paging]],
  ["invoiceItemCategories", "get", "GET", "/invoice_item_categories/{categoryId}", "Retrieve an invoice item category.", []],
  ["invoiceItemCategories", "create", "POST", "/invoice_item_categories", "Create an invoice item category.", [s("name", "body", true), b("use_as_service"), b("use_as_expense")]],
  ["invoiceItemCategories", "update", "PATCH", "/invoice_item_categories/{categoryId}", "Update an invoice item category.", [s("name"), b("use_as_service"), b("use_as_expense")]],
  ["invoiceItemCategories", "delete", "DELETE", "/invoice_item_categories/{categoryId}", "Delete an invoice item category.", []],

  // Estimates
  ["estimates", "list", "GET", "/estimates", "List estimates. Filter by client, state (draft, sent, accepted, declined) and issue date range (YYYY-MM-DD).", [n("client_id", "query"), s("state", "query"), ...since, ...range, ...paging]],
  ["estimates", "get", "GET", "/estimates/{estimateId}", "Retrieve an estimate with its line items.", []],
  ["estimates", "create", "POST", "/estimates", "Create an estimate. line_items is an array of { kind, description, unit_price, quantity, taxed, taxed2 }.", [n("client_id", "body", true), s("number"), s("purchase_order"), n("tax"), n("tax2"), n("discount"), s("subject"), s("notes"), s("currency"), s("issue_date"), j("line_items")]],
  ["estimates", "update", "PATCH", "/estimates/{estimateId}", "Update an estimate.", [n("client_id"), s("number"), s("purchase_order"), n("tax"), n("tax2"), n("discount"), s("subject"), s("notes"), s("currency"), s("issue_date"), j("line_items")]],
  ["estimates", "delete", "DELETE", "/estimates/{estimateId}", "Delete an estimate.", []],
  ["estimates", "listMessages", "GET", "/estimates/{estimateId}/messages", "List messages sent for an estimate.", [...since, ...paging]],
  ["estimates", "sendMessage", "POST", "/estimates/{estimateId}/messages", "Send an estimate by email, or change its state with event_type (accept, decline, re-open, send).", [j("recipients"), s("subject"), s("body"), b("send_me_a_copy"), s("event_type")]],
  ["estimates", "deleteMessage", "DELETE", "/estimates/{estimateId}/messages/{messageId}", "Delete an estimate message.", []],
  ["estimateItemCategories", "list", "GET", "/estimate_item_categories", "List estimate item categories.", [...since, ...paging]],
  ["estimateItemCategories", "get", "GET", "/estimate_item_categories/{categoryId}", "Retrieve an estimate item category.", []],
  ["estimateItemCategories", "create", "POST", "/estimate_item_categories", "Create an estimate item category.", [s("name", "body", true)]],
  ["estimateItemCategories", "update", "PATCH", "/estimate_item_categories/{categoryId}", "Update an estimate item category.", [s("name")]],
  ["estimateItemCategories", "delete", "DELETE", "/estimate_item_categories/{categoryId}", "Delete an estimate item category.", []],

  // Reports (from and to are required, YYYYMMDD or YYYY-MM-DD)
  ["reports", "timeByClients", "GET", "/reports/time/clients", "Time report grouped by client. from and to are required.", [s("from", "query", true), s("to", "query", true), b("include_fixed_fee", "query"), ...paging]],
  ["reports", "timeByProjects", "GET", "/reports/time/projects", "Time report grouped by project. from and to are required.", [s("from", "query", true), s("to", "query", true), b("include_fixed_fee", "query"), ...paging]],
  ["reports", "timeByTasks", "GET", "/reports/time/tasks", "Time report grouped by task. from and to are required.", [s("from", "query", true), s("to", "query", true), b("include_fixed_fee", "query"), ...paging]],
  ["reports", "timeByTeam", "GET", "/reports/time/team", "Time report grouped by team member. from and to are required.", [s("from", "query", true), s("to", "query", true), b("include_fixed_fee", "query"), ...paging]],
  ["reports", "expensesByClients", "GET", "/reports/expenses/clients", "Expense report grouped by client. from and to are required.", [s("from", "query", true), s("to", "query", true), ...paging]],
  ["reports", "expensesByProjects", "GET", "/reports/expenses/projects", "Expense report grouped by project. from and to are required.", [s("from", "query", true), s("to", "query", true), ...paging]],
  ["reports", "expensesByCategories", "GET", "/reports/expenses/categories", "Expense report grouped by category. from and to are required.", [s("from", "query", true), s("to", "query", true), ...paging]],
  ["reports", "expensesByTeam", "GET", "/reports/expenses/team", "Expense report grouped by team member. from and to are required.", [s("from", "query", true), s("to", "query", true), ...paging]],
  ["reports", "uninvoiced", "GET", "/reports/uninvoiced", "Uninvoiced hours and expenses per project. from and to are required.", [s("from", "query", true), s("to", "query", true), ...paging]],
  ["reports", "projectBudget", "GET", "/reports/project_budget", "Budget usage per project.", [b("is_active", "query"), ...paging]],
];

function fieldsOf(path: string, extra: Field[]): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "number", true, "path"]);
  return [...pathFields, ...extra];
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
  let resolved: ReturnType<typeof credentials> | undefined;

  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    resolved ??= credentials(account, fetcher, signal);
    const { token, accountId } = await resolved;
    let url = path;
    const search = new URLSearchParams();
    const body: Record<string, unknown> = {};
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "path") url = url.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "query") search.set(name, String(value));
      else body[name] = value;
    }
    const hasBody = method !== "GET" && method !== "DELETE" && Object.keys(body).length > 0;
    const query = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(`${api}${url}${query}`, {
      method,
      signal,
      headers: { ...headers(token, accountId), ...(hasBody ? { "content-type": "application/json" } : {}) },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Harvest answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra] of rows) {
    const fields = fieldsOf(path, extra);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { harvest: harvest.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.harvest ?? [],
        (account) =>
          withApprovals(build(account as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Harvest",
        description:
          "Harvest time tracking and invoicing: clients, projects, tasks, time entries, expenses, invoices, estimates, users, roles and reports.",
        icons,
      },
    ),
  }),
);
