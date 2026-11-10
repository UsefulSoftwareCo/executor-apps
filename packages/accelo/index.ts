import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Accelo deployment lives on its own host: https://<deployment>.api.accelo.com.
function normalizeDeployment(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9_-]*)(?:\.api\.accelo\.com|\.accelo\.com)?\/?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter the deployment name of <deployment>.accelo.com (letters, digits, - and _).");
  return match[1]!;
}

type Account = { fields: { deployment: string; clientId: string; clientSecret: string } };

const originOf = (account: Account) => `https://${normalizeDeployment(account.fields.deployment)}.api.accelo.com`;

// A service app signs in with its own client id and secret (HTTP Basic) and receives a bearer token.
async function mintToken(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined): Promise<string> {
  const { clientId, clientSecret } = account.fields;
  const response = await fetcher(`${originOf(account)}/oauth2/v0/token`, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "write(all)" }).toString(),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Accelo token request answered ${response.status}: ${text.slice(0, 500)}`);
  const parsed = JSON.parse(text) as { access_token?: string };
  if (typeof parsed.access_token !== "string") throw new Error("Accelo token response had no access_token.");
  return parsed.access_token;
}

const accelo = defineProvider({
  name: "Accelo",
  hosts: ["*.api.accelo.com"],
  auth: {
    // OAuth 2.0 authorization-code is not offered: Accelo's authorize and token URLs are per deployment
    // (<deployment>.api.accelo.com/oauth2/v0/...) and Executor declares them as static strings.
    // A service application (Configuration > API) signs in with client credentials instead.
    serviceApp: secrets({
      label: "Service application",
      fields: object({
        deployment: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const token = await mintToken(account, fetch, signal);
    const deployment = normalizeDeployment(account.fields.deployment);
    const response = await fetch(`${originOf(account)}/api/v0/staff?_limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    // meta is present on every Accelo response; only its presence is checked.
    await decodeJson(response, object({ meta: json() }));
    return { accountInfo: { externalId: deployment, displayName: deployment, profileUrl: `https://${deployment}.accelo.com` } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string, required = false): Field => [name, "string", required, "query"];
const n = (name: string): Field => [name, "number", false, "query"];

// Every list takes Accelo's paging, field selection, filter and search parameters.
const list: Field[] = [n("_page"), n("_limit"), n("_offset"), s("_fields"), s("_filters"), s("_search")];
const one: Field[] = [s("_fields")];
const count: Field[] = [s("_filters"), s("_search")];

type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  description: string,
  fields: Field[],
  hasBody?: boolean,
];

const note =
  "body holds the fields exactly as Accelo documents them (https://api.accelo.com/docs/); values are sent form-encoded.";
const listNote =
  "Pages with _page and _limit (default 10, max 100); _fields adds fields and linked objects, _filters takes Accelo filter expressions such as title(contains(x)) or order_by_desc(date_created), _search does a text search.";

const rows: Row[] = [
  // Companies
  ["companies", "list", "GET", "/companies", `List companies. ${listNote}`, list],
  ["companies", "get", "GET", "/companies/{company_id}", "Retrieve a company.", one],
  ["companies", "count", "GET", "/companies/count", "Count companies.", count],
  ["companies", "create", "POST", "/companies", `Create a company (name is required). ${note}`, [], true],
  ["companies", "update", "PUT", "/companies/{company_id}", `Update a company (name, website, phone, fax, comments). ${note}`, [], true],
  ["companies", "delete", "DELETE", "/companies/{company_id}", "Delete a company.", []],
  ["companies", "listContacts", "GET", "/companies/{company_id}/contacts", `List a company's contacts. ${listNote}`, list],
  ["companies", "listStatuses", "GET", "/companies/statuses", "List company statuses.", list],

  // Contacts
  ["contacts", "list", "GET", "/contacts", `List contacts. ${listNote}`, list],
  ["contacts", "get", "GET", "/contacts/{contact_id}", "Retrieve a contact.", one],
  ["contacts", "count", "GET", "/contacts/count", "Count contacts.", count],
  ["contacts", "create", "POST", "/contacts", `Create a contact (firstname, surname and company_id are required; this also creates an affiliation). ${note}`, [], true],
  ["contacts", "update", "PUT", "/contacts/{contact_id}", `Update a contact. ${note}`, [], true],
  ["contacts", "delete", "DELETE", "/contacts/{contact_id}", "Set a contact to inactive (Accelo does not remove contacts).", []],
  ["contacts", "listStatuses", "GET", "/contacts/statuses", "List contact statuses.", list],

  // Affiliations
  ["affiliations", "list", "GET", "/affiliations", `List affiliations (links between companies and contacts). ${listNote}`, list],
  ["affiliations", "get", "GET", "/affiliations/{affiliation_id}", "Retrieve an affiliation.", one],
  ["affiliations", "create", "POST", "/affiliations", `Create an affiliation (company_id and contact_id are required). ${note}`, [], true],
  ["affiliations", "update", "PUT", "/affiliations/{affiliation_id}", `Update an affiliation. ${note}`, [], true],
  ["affiliations", "delete", "DELETE", "/affiliations/{affiliation_id}", "Delete an affiliation.", []],

  // Addresses
  ["addresses", "list", "GET", "/addresses", `List addresses. ${listNote}`, list],
  ["addresses", "get", "GET", "/addresses/{address_id}", "Retrieve an address.", one],
  ["addresses", "create", "POST", "/addresses", `Create an address (against_type, either company or contact, and against_id are required). ${note}`, [], true],
  ["addresses", "update", "PUT", "/addresses/{address_id}", `Update an address. ${note}`, [], true],

  // Activities
  ["activities", "list", "GET", "/activities", `List activities (notes, emails, calls, meetings and logged time). ${listNote}`, list],
  ["activities", "get", "GET", "/activities/{activity_id}", "Retrieve an activity.", one],
  ["activities", "count", "GET", "/activities/count", "Count activities.", count],
  ["activities", "create", "POST", "/activities", `Create an activity or log time (subject, against_type and against_id are required; medium defaults to note; set visibility to all to log time). ${note}`, [], true],
  ["activities", "update", "PUT", "/activities/{activity_id}", `Update an activity. ${note}`, [], true],
  ["activities", "delete", "DELETE", "/activities/{activity_id}", "Delete an activity.", []],
  ["activities", "allocations", "GET", "/activities/allocations", "Totals of billable, nonbillable and charged time for the filtered activities.", [s("_filters")]],
  ["activities", "listClasses", "GET", "/activities/classes", "List activity classes.", list],

  // Issues (tickets)
  ["issues", "list", "GET", "/issues", `List issues (tickets). ${listNote}`, list],
  ["issues", "get", "GET", "/issues/{issue_id}", "Retrieve an issue.", one],
  ["issues", "count", "GET", "/issues/count", "Count issues.", count],
  ["issues", "create", "POST", "/issues", `Create an issue (title, type_id, against_type and against_id are required). ${note}`, [], true],
  ["issues", "update", "PUT", "/issues/{issue_id}", `Update an issue. Setting status_id or standing bypasses progressions. ${note}`, [], true],
  ["issues", "delete", "DELETE", "/issues/{issue_id}", "Delete an issue.", []],
  ["issues", "listTasks", "GET", "/issues/{issue_id}/tasks", `List an issue's tasks. ${listNote}`, list],
  ["issues", "listStatuses", "GET", "/issues/statuses", "List issue statuses.", list],
  ["issues", "listTypes", "GET", "/issues/types", "List issue types.", list],
  ["issues", "listClasses", "GET", "/issues/classes", "List issue classes.", list],
  ["issues", "listPriorities", "GET", "/issues/priorities", "List issue priorities.", list],
  ["issues", "listResolutions", "GET", "/issues/resolutions", "List issue resolutions.", list],

  // Jobs (projects)
  ["jobs", "list", "GET", "/jobs", `List jobs (projects). ${listNote}`, list],
  ["jobs", "get", "GET", "/jobs/{job_id}", "Retrieve a job.", one],
  ["jobs", "count", "GET", "/jobs/count", "Count jobs.", count],
  ["jobs", "create", "POST", "/jobs", `Create a job (against_type, against_id, manager_id, type_id and title are required). ${note}`, [], true],
  ["jobs", "update", "PUT", "/jobs/{job_id}", `Update a job. ${note}`, [], true],
  ["jobs", "delete", "DELETE", "/jobs/{job_id}", "Delete a job.", []],
  ["jobs", "listMilestones", "GET", "/jobs/{job_id}/milestones", `List a job's milestones. ${listNote}`, list],
  ["jobs", "listStatuses", "GET", "/jobs/statuses", "List job statuses.", list],
  ["jobs", "listTypes", "GET", "/jobs/types", "List job types.", list],

  // Milestones (read-only through the API)
  ["milestones", "list", "GET", "/milestones", `List milestones. ${listNote}`, list],
  ["milestones", "get", "GET", "/milestones/{milestone_id}", "Retrieve a milestone.", one],
  ["milestones", "count", "GET", "/milestones/count", "Count milestones.", count],
  ["milestones", "listStatuses", "GET", "/milestones/statuses", "List milestone statuses.", list],

  // Tasks
  ["tasks", "list", "GET", "/tasks", `List tasks. ${listNote}`, list],
  ["tasks", "get", "GET", "/tasks/{task_id}", "Retrieve a task.", one],
  ["tasks", "count", "GET", "/tasks/count", "Count tasks.", count],
  ["tasks", "create", "POST", "/tasks", `Create a task (title, against_type and against_id are required). ${note}`, [], true],
  ["tasks", "update", "PUT", "/tasks/{task_id}", `Update a task. ${note}`, [], true],
  ["tasks", "listPriorities", "GET", "/tasks/priorities", "List task priorities.", list],
  ["tasks", "listStatuses", "GET", "/tasks/statuses", "List task statuses.", list],

  // Prospects (sales)
  ["prospects", "list", "GET", "/prospects", `List prospects (sales opportunities). ${listNote}`, list],
  ["prospects", "get", "GET", "/prospects/{prospect_id}", "Retrieve a prospect.", one],
  ["prospects", "count", "GET", "/prospects/count", "Count prospects.", count],
  ["prospects", "create", "POST", "/prospects", `Create a prospect (title, affiliation_id and type_id are required). ${note}`, [], true],
  ["prospects", "update", "PUT", "/prospects/{prospect_id}", `Update a prospect. ${note}`, [], true],
  ["prospects", "delete", "DELETE", "/prospects/{prospect_id}", "Delete a prospect.", []],
  ["prospects", "listStatuses", "GET", "/prospects/statuses", "List prospect statuses.", list],
  ["prospects", "listTypes", "GET", "/prospects/types", "List prospect types.", list],

  // Requests
  ["requests", "list", "GET", "/requests", `List requests. ${listNote}`, list],
  ["requests", "get", "GET", "/requests/{request_id}", "Retrieve a request.", one],
  ["requests", "count", "GET", "/requests/count", "Count requests.", count],
  ["requests", "create", "POST", "/requests", `Create a request (title, body and type_id are required; affiliation_id links the requester). ${note}`, [], true],
  ["requests", "update", "PUT", "/requests/{request_id}", `Update a request. ${note}`, [], true],
  ["requests", "listTypes", "GET", "/requests/types", "List request types.", list],

  // Contracts (retainers)
  ["contracts", "list", "GET", "/contracts", `List contracts (retainers). ${listNote}`, list],
  ["contracts", "get", "GET", "/contracts/{contract_id}", "Retrieve a contract.", one],
  ["contracts", "count", "GET", "/contracts/count", "Count contracts.", count],
  ["contracts", "listPeriods", "GET", "/contracts/{contract_id}/periods", `List a contract's periods. ${listNote}`, list],
  ["contracts", "listTypes", "GET", "/contracts/types", "List contract types.", list],
  ["contracts", "listStatuses", "GET", "/contracts/statuses", "List contract statuses.", list],

  // Quotes
  ["quotes", "list", "GET", "/quotes", `List quotes. ${listNote}`, list],
  ["quotes", "get", "GET", "/quotes/{quote_id}", "Retrieve a quote.", one],
  ["quotes", "count", "GET", "/quotes/count", "Count quotes.", count],
  ["quotes", "create", "POST", "/quotes", `Create a quote (title, against_type and against_id are required). ${note}`, [], true],
  ["quotes", "update", "PUT", "/quotes/{quote_id}", `Update a quote. ${note}`, [], true],
  ["quotes", "listStatuses", "GET", "/quotes/statuses", "List quote statuses.", list],

  // Invoices and payments (read-only through the API)
  ["invoices", "list", "GET", "/invoices", `List invoices. ${listNote}`, list],
  ["invoices", "get", "GET", "/invoices/{invoice_id}", "Retrieve an invoice.", one],
  ["invoices", "count", "GET", "/invoices/count", "Count invoices.", count],
  ["invoices", "listLineItems", "GET", "/invoices/line_items", `List invoice line items (beta). ${listNote}`, list],
  ["payments", "list", "GET", "/payments", `List payments (beta). ${listNote}`, list],
  ["payments", "get", "GET", "/payments/{payment_id}", "Retrieve a payment (beta).", one],

  // Expenses
  ["expenses", "list", "GET", "/expenses", `List expenses. ${listNote}`, list],
  ["expenses", "get", "GET", "/expenses/{expense_id}", "Retrieve an expense.", one],
  ["expenses", "count", "GET", "/expenses/count", "Count expenses.", count],
  ["expenses", "create", "POST", "/expenses", `Create an expense (title, against_id, against_type, unit_cost, quantity and type_id are required). ${note}`, [], true],
  ["expenses", "update", "PUT", "/expenses/{expense_id}", `Update an expense. ${note}`, [], true],
  ["expenses", "delete", "DELETE", "/expenses/{expense_id}", "Delete an expense.", []],
  ["expenses", "listTypes", "GET", "/expenses/types", "List expense types.", list],

  // Timers
  ["timers", "list", "GET", "/timers", `List timers. ${listNote}`, list],
  ["timers", "get", "GET", "/timers/{timer_id}", "Retrieve a timer.", one],
  ["timers", "create", "POST", "/timers", `Create a timer (subject is required; auto_start 1 starts it and stops any running timer). ${note}`, [], true],
  ["timers", "update", "PUT", "/timers/{timer_id}", `Update a timer (subject, against_type, against_id, seconds on stopped timers). ${note}`, [], true],
  ["timers", "delete", "DELETE", "/timers/{timer_id}", "Delete a timer.", []],
  ["timers", "start", "PUT", "/timers/{timer_id}/start", "Start a timer.", []],
  ["timers", "pause", "PUT", "/timers/{timer_id}/pause", "Pause a timer.", []],
  ["timers", "cancel", "PUT", "/timers/{timer_id}/cancel", "Cancel a timer.", []],

  // Staff
  ["staff", "whoami", "GET", "/staff/whoami", "Retrieve the staff member the token acts as.", one],
  ["staff", "list", "GET", "/staff", `List staff. ${listNote}`, list],
  ["staff", "get", "GET", "/staff/{staff_id}", "Retrieve a staff member.", one],
  ["staff", "count", "GET", "/staff/count", "Count staff.", count],
  ["staff", "create", "POST", "/staff", `Create a staff member. ${note}`, [], true],
  ["staff", "update", "PUT", "/staff/{staff_id}", `Update a staff member. ${note}`, [], true],
  ["groups", "list", "GET", "/groups", `List groups (beta). ${listNote}`, list],
  ["divisions", "list", "GET", "/divisions", `List divisions (beta). ${listNote}`, list],

  // Assets, rates, tags, holidays, filters
  ["assets", "list", "GET", "/assets", `List assets. ${listNote}`, list],
  ["assets", "get", "GET", "/assets/{asset_id}", "Retrieve an asset.", one],
  ["assets", "update", "PUT", "/assets/{asset_id}", `Update an asset (only title can change). ${note}`, [], true],
  ["rates", "list", "GET", "/rates", `List rates. ${listNote}`, list],
  ["tags", "list", "GET", "/tags", `List tags. ${listNote}`, list],
  ["tags", "create", "POST", "/tags", `Create a tag (name). ${note}`, [], true],
  ["holidays", "list", "GET", "/holidays", `List holidays (beta). ${listNote}`, list],
  ["holidays", "create", "POST", "/holidays", `Create a holiday (title, date_start and exactly one of date_end or duration_seconds are required). ${note}`, [], true],
  ["holidays", "delete", "DELETE", "/holidays/{holiday_id}", "Delete a holiday.", []],
  ["filters", "list", "GET", "/filters", "List saved filters.", list],

  // Custom fields on companies, contacts, jobs, issues and the like
  ["profiles", "listFields", "GET", "/{object}/profiles/fields", "List profile (custom) fields of an object type: companies, contacts, affiliations, staff, invoices, issues, jobs, milestones, prospects, contracts.", [["object", "string", true, "path"]]],
  ["profiles", "listValues", "GET", "/{object}/{object_id}/profiles/values", "List the profile field values of one object.", [["object", "string", true, "path"], ["object_id", "string", true, "path"]]],
  ["extensions", "listFields", "GET", "/{object}/extensions/fields", "List extension fields of assets, contracts, issues, jobs or prospects.", [["object", "string", true, "path"]]],
  ["extensions", "listValues", "GET", "/{object}/{object_id}/extensions/values", "List the extension field values of one object.", [["object", "string", true, "path"], ["object_id", "string", true, "path"]]],

  // Webhooks
  ["webhooks", "listSubscriptions", "GET", "/webhooks/subscriptions", "List webhook subscriptions.", list],
  ["webhooks", "listTypes", "GET", "/webhooks/subscriptions/types", "List webhook subscription types.", []],
  ["webhooks", "createSubscription", "POST", "/webhooks/subscriptions", `Create a webhook subscription (trigger_url and event_id are required; secret signs payloads). ${note}`, [], true],
  ["webhooks", "deleteSubscription", "DELETE", "/webhooks/subscriptions/{subscription_id}", "Delete a webhook subscription.", []],
];

function fieldsOf(path: string, extra: Field[], hasBody: boolean | undefined): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1]!)
    .filter((name) => !extra.some(([known]) => known === name))
    .map((name) => [name, "string", true, "path"]);
  const body: Field[] = hasBody === true ? [["body", "json", true, "query"]] : [];
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
  let token: Promise<string> | undefined;
  const bearer = () => (token ??= mintToken(account, fetcher, signal));

  const call = async (
    method: string,
    path: string,
    fields: Field[],
    hasBody: boolean,
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
    let form: string | undefined;
    if (hasBody && typeof input.body === "object" && input.body !== null) {
      const encoded = new URLSearchParams();
      for (const [key, value] of Object.entries(input.body as Record<string, unknown>)) {
        if (value === undefined || value === null) continue;
        encoded.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
      }
      form = encoded.toString();
    }
    const url = `${originOf(account)}/api/v0${target}${params.size > 0 ? `?${params.toString()}` : ""}`;
    const response = await fetcher(url, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await bearer()}`,
        Accept: "application/json",
        ...(form !== undefined ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: form,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Accelo answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra, hasBody] of rows) {
    const fields = fieldsOf(path, extra, hasBody);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, hasBody === true, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { accelo: accelo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.accelo ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Accelo",
        description:
          "Accelo professional services automation: companies, contacts, issues (tickets), jobs (projects), tasks, activities and time, prospects, contracts, quotes, invoices, expenses, timers and webhooks.",
        instructions:
          "Objects link to each other with against_type and against_id (for example company, contact, job, issue, task, prospect, contract). Responses wrap results in { meta, response }. Lists take _page/_limit, _fields, _filters and _search. Write tools take body as the object's fields; it is sent form-encoded.",
        icons,
      },
    ),
  }),
);
