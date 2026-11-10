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

// Every Freshsales (Freshworks CRM) account lives on its own host. Current accounts use
// https://<bundle-alias>.myfreshworks.com/crm/sales/api (the docs also accept .freshworks.com); older ones use https://<domain>.freshsales.io/api.
const apiBase = (domain: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9])(\.myfreshworks\.com|\.freshworks\.com|\.freshsales\.io)?(?:\/.*)?$/.exec(
    domain.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the bundle alias shown under your API key (the acme in acme.myfreshworks.com).");
  const suffix = match[2] ?? ".myfreshworks.com";
  if (suffix === ".freshsales.io") return `https://${match[1]}.freshsales.io/api`;
  return `https://${match[1]}${suffix}/crm/sales/api`;
};

const ContactFields = object({ fields: json() });

const freshsales = defineProvider({
  name: "Freshsales",
  hosts: ["*.myfreshworks.com", "*.freshworks.com", "*.freshsales.io"],
  auth: {
    // Freshsales authenticates with "Authorization: Token token=<API key>". The API offers no
    // user-created OAuth apps.
    apiKey: secrets({
      label: "API key",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
      request: ({ apiKey }) => header("authorization", t`Token token=${apiKey}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = apiBase(account.fields.domain);
    const response = await fetch(account.url(`${base}/settings/contacts/fields`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    await decodeJson(response, ContactFields);
    return { accountInfo: { externalId: new URL(base).host, displayName: new URL(base).host } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Field = [name: string, type: Type, required: boolean, where: "path" | "query" | "body"];

const s = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "number", required, where];
const b = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "boolean", required, where];
const j = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "json", required, where];

const paging = [n("page", "query"), n("per_page", "query")];

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

const stringPath = new Set<string>(["entity", "selector"]);

const viewSort = [s("sort", "query"), s("sort_type", "query")];
const inc = s("include", "query");

const rows: Row[] = [
  // Contacts
  ["contacts", "get", "GET", "/contacts/{contactId}", "Retrieve a contact. include is a comma-separated list of: sales_activities, owner, creater, updater, source, campaign, tasks, appointments, notes, deals, sales_accounts, territory.", [inc]],
  ["contacts", "create", "POST", "/contacts", "Create a contact. Needs one of email, mobile_number or twitter. contact is the object body, e.g. {first_name, last_name, emails, mobile_number, job_title, owner_id, lifecycle_stage_id, contact_status_id, custom_field, sales_accounts: [{id, is_primary}]}. A contact links to at most 10 accounts, exactly one primary.", [j("contact", "body", true)]],
  ["contacts", "update", "PUT", "/contacts/{contactId}", "Update a contact. contact holds the fields to change, including custom_field.", [j("contact", "body", true)]],
  ["contacts", "delete", "DELETE", "/contacts/{contactId}", "Delete a contact (moves it to the trash).", []],
  ["contacts", "forget", "DELETE", "/contacts/{contactId}/forget", "Permanently delete a contact.", []],
  ["contacts", "clone", "POST", "/contacts/{contactId}/clone", "Clone a contact. contact optionally overrides fields on the copy.", [j("contact")]],
  ["contacts", "upsert", "POST", "/contacts/upsert", "Create or update a contact matched by unique_identifier, e.g. {\"emails\": \"a@b.com\"}. Returns 200 on update, 201 on create.", [j("unique_identifier", "body", true), j("contact", "body", true)]],
  ["contacts", "bulkUpsert", "POST", "/contacts/bulk_upsert", "Upsert up to 100 contacts. contacts is an array of {emails|id: value, data: {...}}. Returns a job_status_url; poll it with jobs.get.", [j("contacts", "body", true)]],
  ["contacts", "bulkAssignOwner", "POST", "/contacts/bulk_assign_owner", "Assign an owner to many contacts.", [j("selected_ids", "body", true), n("owner_id", "body", true)]],
  ["contacts", "bulkDelete", "POST", "/contacts/bulk_destroy", "Delete many contacts.", [j("selected_ids", "body", true)]],
  ["contacts", "manageTeamMembers", "POST", "/contacts/{contactId}/manage_team_members", "Add or remove team members. team_users is an array of {user_id, designation_id, _destroy?}.", [j("team_users", "body", true)]],
  ["contacts", "listViews", "GET", "/contacts/filters", "List contact views (saved filters) and their ids.", []],
  ["contacts", "listInView", "GET", "/contacts/view/{viewId}", "List contacts in a view. sort is one of lead_score, created_at, updated_at, open_deals_amount, last_contacted; sort_type asc or desc. include as for contacts.get.", [inc, ...viewSort, ...paging]],
  ["contacts", "listActivities", "GET", "/contacts/{contactId}/activities", "List a contact's activity timeline. include=user adds the acting user; limit caps results.", [inc, n("limit", "query")]],
  ["contacts", "listFields", "GET", "/settings/contacts/fields", "List contact field definitions including custom fields. include=field_group adds field groups.", [inc]],

  // Accounts
  ["accounts", "get", "GET", "/sales_accounts/{accountId}", "Retrieve an account. include is a comma-separated list of: owner, creater, updater, territory, business_type, tasks, appointments, contacts, deals, industry_type, child_sales_accounts.", [inc]],
  ["accounts", "create", "POST", "/sales_accounts", "Create an account. sales_account is the object body; name is required. May include custom_field and parent_sales_account: {name}.", [j("sales_account", "body", true)]],
  ["accounts", "update", "PUT", "/sales_accounts/{accountId}", "Update an account.", [j("sales_account", "body", true)]],
  ["accounts", "delete", "DELETE", "/sales_accounts/{accountId}", "Delete an account. delete_associated_contacts_deals=true also deletes its contacts and deals.", [b("delete_associated_contacts_deals", "query")]],
  ["accounts", "forget", "DELETE", "/sales_accounts/{accountId}/forget", "Permanently delete an account.", []],
  ["accounts", "clone", "POST", "/sales_accounts/{accountId}/clone", "Clone an account. sales_account optionally overrides fields.", [j("sales_account")]],
  ["accounts", "upsert", "POST", "/sales_accounts/upsert", "Create or update an account matched by unique_identifier, e.g. {\"name\": \"Acme\"}.", [j("unique_identifier", "body", true), j("sales_account", "body", true)]],
  ["accounts", "bulkUpsert", "POST", "/sales_accounts/bulk_upsert", "Upsert up to 100 accounts. sales_accounts is an array of {name|id: value, data: {...}}.", [j("sales_accounts", "body", true)]],
  ["accounts", "bulkDelete", "POST", "/sales_accounts/bulk_destroy", "Delete many accounts.", [j("selected_ids", "body", true), b("delete_associated_contacts_deals")]],
  ["accounts", "manageTeamMembers", "POST", "/sales_accounts/{accountId}/manage_team_members", "Add or remove team members. team_users is an array of {user_id, designation_id, _destroy?}.", [j("team_users", "body", true)]],
  ["accounts", "listViews", "GET", "/sales_accounts/filters", "List account views (saved filters) and their ids.", []],
  ["accounts", "listInView", "GET", "/sales_accounts/view/{viewId}", "List accounts in a view. sort is one of created_at, updated_at, open_deals_amount, last_contacted; sort_type asc or desc.", [inc, ...viewSort, ...paging]],
  ["accounts", "listFields", "GET", "/settings/sales_accounts/fields", "List account field definitions including custom fields.", [inc]],

  // Deals
  ["deals", "get", "GET", "/deals/{dealId}", "Retrieve a deal. include is a comma-separated list of: sales_activities, owner, creater, updater, source, contacts, sales_account, deal_stage, deal_type, deal_reason, campaign, deal_payment_status, deal_product, currency.", [inc]],
  ["deals", "create", "POST", "/deals", "Create a deal. deal is the object body; name and amount are required, plus sales_account_id or sales_account: {name}. May include deal_stage_id, deal_pipeline_id, expected_close, owner_id, custom_field and contacts_added_list: [contact ids].", [j("deal", "body", true)]],
  ["deals", "update", "PUT", "/deals/{dealId}", "Update a deal, e.g. {\"probability\": 30, \"deal_stage_id\": 5, \"contacts_removed_list\": [2]}.", [j("deal", "body", true)]],
  ["deals", "delete", "DELETE", "/deals/{dealId}", "Delete a deal.", []],
  ["deals", "forget", "DELETE", "/deals/{dealId}/forget", "Permanently delete a deal.", []],
  ["deals", "clone", "POST", "/deals/{dealId}/clone", "Clone a deal. deal optionally overrides fields.", [j("deal")]],
  ["deals", "upsert", "POST", "/deals/upsert", "Create or update a deal matched by unique_identifier, e.g. {\"name\": \"Sample deal\"}.", [j("unique_identifier", "body", true), j("deal", "body", true)]],
  ["deals", "bulkUpsert", "POST", "/deals/bulk_upsert", "Upsert up to 100 deals. deals is an array of {name|id: value, data: {...}}.", [j("deals", "body", true)]],
  ["deals", "bulkDelete", "POST", "/deals/bulk_destroy", "Delete many deals.", [j("selected_ids", "body", true)]],
  ["deals", "manageTeamMembers", "POST", "/deals/{dealId}/manage_team_members", "Add or remove team members. team_users is an array of {user_id, designation_id, _destroy?}.", [j("team_users", "body", true)]],
  ["deals", "listViews", "GET", "/deals/filters", "List deal views (saved filters) and their ids.", []],
  ["deals", "listInView", "GET", "/deals/view/{viewId}", "List deals in a view. sort is one of amount, expected_close, created_at, updated_at, last_contacted; sort_type asc or desc.", [inc, ...viewSort, ...paging]],
  ["deals", "listFields", "GET", "/settings/deals/fields", "List deal field definitions including custom fields.", [inc]],

  // Marketing lists
  ["lists", "list", "GET", "/lists", "List contact lists.", []],
  ["lists", "create", "POST", "/lists", "Create a contact list.", [s("name", "body", true)]],
  ["lists", "rename", "PUT", "/lists/{listId}", "Rename a contact list.", [s("name", "body", true)]],
  ["lists", "listContacts", "GET", "/contacts/lists/{listId}", "List the contacts in a list.", [...paging]],
  ["lists", "addContacts", "PUT", "/lists/{listId}/add_contacts", "Add contacts to a list. ids is an array of contact ids.", [j("ids", "body", true)]],
  ["lists", "removeContacts", "PUT", "/lists/{listId}/remove_contacts", "Remove contacts from a list: ids array, or all=true for every contact.", [j("ids"), b("all")]],
  ["lists", "moveContacts", "PUT", "/lists/{listId}/move_contacts", "Move contacts from another list into this one. Omit ids to move all.", [j("ids"), n("from_list_id", "body", true)]],

  // Notes
  ["notes", "create", "POST", "/notes", "Add a note. note is {description, targetable_type, targetable_id}; targetable_type is Contact, SalesAccount or Deal.", [j("note", "body", true)]],
  ["notes", "update", "PUT", "/notes/{noteId}", "Update a note, same body shape as create.", [j("note", "body", true)]],
  ["notes", "delete", "DELETE", "/notes/{noteId}", "Delete a note.", []],

  // Tasks
  ["tasks", "list", "GET", "/tasks", "List tasks. filter is required, one value per request: open, due_today, due_tomorrow, overdue or completed. include may be users, targetable, owner.", [s("filter", "query", true), inc, ...paging]],
  ["tasks", "get", "GET", "/tasks/{taskId}", "Retrieve a task. include may be users, targetable.", [inc]],
  ["tasks", "create", "POST", "/tasks", "Create a task. task needs title, due_date, owner_id, targetable_id and targetable_type (Contact, SalesAccount or Deal); optional description, task_type_id, outcome_id, task_users_attributes: [{user_id}].", [j("task", "body", true)]],
  ["tasks", "update", "PUT", "/tasks/{taskId}", "Update a task. Mark done with {\"status\": 1}; 0 is open.", [j("task", "body", true)]],
  ["tasks", "delete", "DELETE", "/tasks/{taskId}", "Delete a task.", []],

  // Appointments
  ["appointments", "list", "GET", "/appointments", "List appointments. filter is required: open (upcoming) or complete. include may be creater, targetable, appointment_attendees.", [s("filter", "query", true), inc, ...paging]],
  ["appointments", "get", "GET", "/appointments/{appointmentId}", "Retrieve an appointment.", [inc]],
  ["appointments", "create", "POST", "/appointments", "Create an appointment. appointment needs title, from_date, end_date; optional description, time_zone, location, is_allday, targetable_id, targetable_type, appointment_attendees_attributes: [{attendee_type, attendee_id}] (attendee_type is FdMultitenant::User or Contact).", [j("appointment", "body", true)]],
  ["appointments", "update", "PUT", "/appointments/{appointmentId}", "Update an appointment.", [j("appointment", "body", true)]],
  ["appointments", "delete", "DELETE", "/appointments/{appointmentId}", "Delete an appointment.", []],

  // Sales activities
  ["salesActivities", "list", "GET", "/sales_activities", "List logged sales activities.", [...paging]],
  ["salesActivities", "get", "GET", "/sales_activities/{activityId}", "Retrieve a sales activity.", []],
  ["salesActivities", "create", "POST", "/sales_activities", "Log a sales activity. sales_activity needs title, sales_activity_type_id, start_date, end_date, owner_id, targetable_id and targetable_type; optional notes, location, sales_activity_outcome_id, custom_field.", [j("sales_activity", "body", true)]],
  ["salesActivities", "update", "PUT", "/sales_activities/{activityId}", "Update a sales activity.", [j("sales_activity", "body", true)]],
  ["salesActivities", "delete", "DELETE", "/sales_activities/{activityId}", "Delete a sales activity.", []],
  ["salesActivities", "listFields", "GET", "/settings/sales_activities/fields", "List sales activity field definitions.", [inc]],
  ["phoneCalls", "log", "POST", "/phone_calls", "Log a manual phone call. phone_call is {call_direction (true incoming, false outgoing), targetable_type (contact or salesAccount), targetable: {id?, first_name, last_name, mobile_number...}, note?: {description}, outcome_id?}. Omit targetable.id to create the contact.", [j("phone_call", "body", true)]],

  // Search
  ["search", "search", "GET", "/search", "Search by text. Both q and include are required; include is a comma-separated list of user, contact, sales_account, deal (singular names).", [s("q", "query", true), s("include", "query", true), n("per_page", "query")]],
  ["search", "lookup", "GET", "/lookup", "Exact-match lookup of one field. f is the field (name, email for contacts, or a custom field internal name like cf_x); entities is contact, sales_account or deal.", [s("q", "query", true), s("f", "query", true), s("entities", "query", true)]],
  ["search", "filteredSearch", "POST", "/filtered_search/{entity}", "Filtered search. entity is contact, sales_account or deal. filter_rule is an array of {attribute, operator, value}, e.g. [{\"attribute\": \"contact_email.email\", \"operator\": \"is_in\", \"value\": \"a@b.com\"}]. Optional page and per_page (max 100) go in the query.", [j("filter_rule", "body", true), ...paging]],

  // Configuration (selectors)
  ["settings", "listOwners", "GET", "/selector/owners", "List users that can own records.", []],
  ["settings", "listTerritories", "GET", "/selector/territories", "List territories.", []],
  ["settings", "listCurrencies", "GET", "/selector/currencies", "List currencies.", []],
  ["settings", "listDealStages", "GET", "/selector/deal_stages", "List deal stages.", []],
  ["settings", "listDealPipelines", "GET", "/selector/deal_pipelines", "List deal pipelines.", []],
  ["settings", "listPipelineStages", "GET", "/selector/deal_pipelines/{pipelineId}/deal_stages", "List the stages of one deal pipeline.", []],
  ["settings", "listDealReasons", "GET", "/selector/deal_reasons", "List deal lost reasons.", []],
  ["settings", "listDealTypes", "GET", "/selector/deal_types", "List deal types.", []],
  ["settings", "listDealPaymentStatuses", "GET", "/selector/deal_payment_statuses", "List deal payment statuses.", []],
  ["settings", "listDealProducts", "GET", "/selector/deal_products", "List deal products.", []],
  ["settings", "listLeadSources", "GET", "/selector/lead_sources", "List lead sources.", []],
  ["settings", "listIndustryTypes", "GET", "/selector/industry_types", "List industry types.", []],
  ["settings", "listBusinessTypes", "GET", "/selector/business_types", "List business types.", []],
  ["settings", "listCampaigns", "GET", "/selector/campaigns", "List campaigns.", []],
  ["settings", "listContactStatuses", "GET", "/selector/contact_statuses", "List contact statuses.", []],
  ["settings", "listLifecycleStages", "GET", "/selector/lifecycle_stages", "List lifecycle stages.", []],
  ["settings", "listDesignations", "GET", "/selector/designations", "List team member designations.", []],
  ["settings", "listSalesActivityTypes", "GET", "/selector/sales_activity_types", "List sales activity types.", []],
  ["settings", "listSalesActivityOutcomes", "GET", "/selector/sales_activity_outcomes", "List sales activity outcomes.", []],
  ["settings", "listActivityTypeOutcomes", "GET", "/selector/sales_activity_types/{activityTypeId}/sales_activity_outcomes", "List outcomes of one sales activity type.", []],

  // Background jobs
  ["jobs", "get", "GET", "/job_statuses/{jobId}", "Check the status of a bulk upsert job.", []],
];

function fieldsOf(path: string, extra: Field[]): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [
    m[1]!,
    stringPath.has(m[1]!) ? "string" : "number",
    true,
    "path",
  ]);
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

type Account = {
  fields: { domain: string };
  url: (url: string) => string;
  headers: () => Record<string, string>;
};

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = apiBase(account.fields.domain);

  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
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
    const sendsBody = method === "POST" || method === "PUT";
    const queryString = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(account.url(`${base}${url}${queryString}`), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(sendsBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(body) : sendsBody ? "{}" : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Freshsales answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra] of rows) {
    const fields = fieldsOf(path, extra);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    // filtered search is a POST that only reads
    const readOnly = method === "GET" || path.startsWith("/filtered_search/");
    const tool = readOnly ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { freshsales: freshsales.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.freshsales ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Freshsales",
        description:
          "Freshsales (Freshworks CRM): contacts, accounts, deals, lists, notes, tasks, appointments, sales activities, search and CRM configuration.",
        icons,
      },
    ),
  }),
);
