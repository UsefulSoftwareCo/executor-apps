import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
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

const origin = "https://ui.boondmanager.com";
const base = `${origin}/api`;

type Account =
  | { method: "basic"; fields: { username: string; password: string } }
  | { method: "jwt"; fields: { userToken: string; clientToken: string; clientKey: string } }
  | { method: "oauth"; fields: { access_token: string } };

const b64url = (bytes: Uint8Array | string) => {
  const raw = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  let binary = "";
  for (const byte of raw) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// X-Jwt-Client-BoondManager: an HS256 token signed with the client key, valid for five minutes.
async function clientJwt(fields: { userToken: string; clientToken: string; clientKey: string }): Promise<string> {
  const header = b64url(JSON.stringify({ typ: "JWT", alg: "HS256" }));
  const payload = b64url(
    JSON.stringify({
      userToken: fields.userToken,
      clientToken: fields.clientToken,
      time: Math.floor(Date.now() / 1000),
      mode: "normal",
    }),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(fields.clientKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`)));
  return `${header}.${payload}.${b64url(signature)}`;
}

async function authHeaders(account: Account): Promise<Record<string, string>> {
  if (account.method === "oauth") return { Authorization: `Bearer ${account.fields.access_token}` };
  if (account.method === "basic") {
    return { Authorization: `Basic ${btoa(`${account.fields.username}:${account.fields.password}`)}` };
  }
  return { "X-Jwt-Client-BoondManager": await clientJwt(account.fields) };
}

const boond = defineProvider({
  name: "BoondManager",
  hosts: ["ui.boondmanager.com"],
  auth: {
    // Boond's own OAuth2 apps (Developer space > Apps > Security) use the standard authorization-code flow.
    // Which endpoints an app may call is configured on the app ("Authorized APIs"), not through scopes.
    oauth: oauth2({
      authorizationUrl: `${base}/oauth2/authorize`,
      tokenUrl: `${base}/oauth2/token`,
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
    clientToken: secrets({
      label: "Client token and key (X-Jwt-Client)",
      fields: object({
        userToken: string({ minLength: 1 }),
        clientToken: plain(string({ minLength: 1 })),
        clientKey: string({ minLength: 1 }),
      }),
    }),
    basic: secrets({
      label: "Login and password (Basic)",
      fields: object({ username: plain(string({ minLength: 1 })), password: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/application/current-user`, {
      signal,
      headers: { ...(await authHeaders(toAccount(account))), Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ data: object({ id: string() }) }));
    return { accountInfo: { externalId: me.data.id } };
  },
});

function toAccount(account: { method: string; fields: Record<string, string> }): Account {
  if (account.method === "oauth") return { method: "oauth", fields: { access_token: account.fields.access_token! } };
  if (account.method === "basic") {
    return { method: "basic", fields: { username: account.fields.username!, password: account.fields.password! } };
  }
  return {
    method: "jwt",
    fields: {
      userToken: account.fields.userToken!,
      clientToken: account.fields.clientToken!,
      clientKey: account.fields.clientKey!,
    },
  };
}

type Method = "GET" | "POST" | "PUT" | "DELETE";
// list: paging, keywords and sorting; body: a JSON:API document; query: other query parameters.
type Kind = "list" | "get" | "write" | "body" | "action";
type Row = [group: string, action: string, method: Method, path: string, description: string, kind: Kind];

const listNote =
  "Pages with page (from 1) and maxResults (default 30, max 500). keywords searches the resource (an identifier such as CAND12 also works). query takes the resource's other filters (states, period with startDate and endDate, perimeterAgencies, flags, returnMoreData, ...); list values are comma separated.";

// Entities with /information: reads are get, updates go to /information.
const entities: [group: string, path: string, singular: string, hasDefault: boolean, search: boolean][] = [
  ["candidates", "candidates", "candidate", true, true],
  ["resources", "resources", "resource (consultant or employee)", true, true],
  ["contacts", "contacts", "contact", true, true],
  ["companies", "companies", "company", true, true],
  ["opportunities", "opportunities", "opportunity", true, true],
  ["projects", "projects", "project", false, true],
  ["orders", "orders", "order", true, true],
  ["invoices", "invoices", "invoice", true, true],
  ["purchases", "purchases", "purchase", true, true],
  ["products", "products", "product", true, true],
  ["agencies", "agencies", "agency", true, true],
];

// Resources updated directly on /<path>/{id}.
const direct: [group: string, path: string, singular: string, hasDefault: boolean, search: boolean][] = [
  ["actions", "actions", "action (activity log)", true, true],
  ["positionings", "positionings", "positioning", false, true],
  ["contracts", "contracts", "contract", true, false],
  ["deliveries", "deliveries", "delivery", false, false],
  ["providerInvoices", "provider-invoices", "provider invoice", true, true],
  ["payments", "payments", "payment", true, true],
  ["poles", "poles", "pole", false, true],
  ["businessUnits", "business-units", "business unit", true, true],
  ["timesReports", "times-reports", "time report", true, true],
  ["expensesReports", "expenses-reports", "expense report", true, true],
  ["absencesReports", "absences-reports", "absence report", true, true],
];

const rows: Row[] = [];
const row = (...r: Row) => rows.push(r);

for (const [group, path, noun, hasDefault, search] of entities) {
  if (search) row(group, "list", "GET", `/${path}`, `Search ${group}. ${listNote}`, "list");
  row(group, "get", "GET", `/${path}/{id}`, `Get a ${noun}'s basic data.`, "get");
  row(group, "getInformation", "GET", `/${path}/{id}/information`, `Get a ${noun}'s full information data.`, "get");
  if (hasDefault) row(group, "getDefault", "GET", `/${path}/default`, `Get the empty ${noun} template: the default attributes to fill in before create.`, "get");
  row(group, "create", "POST", `/${path}`, `Create a ${noun}. body is a JSON:API document { data: { type, attributes, relationships } }; read getDefault for the shape.`, "body");
  row(group, "update", "PUT", `/${path}/{id}/information`, `Update a ${noun}'s information. body is a JSON:API document { data: { id, type, attributes, relationships } }.`, "body");
  row(group, "delete", "DELETE", `/${path}/{id}`, `Delete a ${noun}.`, "get");
}
for (const [group, path, noun, hasDefault, search] of direct) {
  if (search) row(group, "list", "GET", `/${path}`, `Search ${group}. ${listNote}`, "list");
  row(group, "get", "GET", `/${path}/{id}`, `Get a ${noun}.`, "get");
  if (hasDefault) row(group, "getDefault", "GET", `/${path}/default`, `Get the empty ${noun} template: the default attributes to fill in before create.`, "get");
  row(group, "create", "POST", `/${path}`, `Create a ${noun}. body is a JSON:API document { data: { type, attributes, relationships } }.`, "body");
  row(group, "update", "PUT", `/${path}/{id}`, `Update a ${noun}. body is a JSON:API document { data: { id, type, attributes, relationships } }.`, "body");
  row(group, "delete", "DELETE", `/${path}/{id}`, `Delete a ${noun}.`, "get");
}

// Related collections and rights of one entity.
for (const [group, path] of [...entities, ...direct].map((e) => [e[0], e[1]] as const)) {
  if (!["poles", "businessUnits", "payments"].includes(group) || group === "payments") {
    row(group, "getRights", "GET", `/${path}/{id}/rights`, "Get what the current user may do with this record.", "get");
  }
}
const related: [group: string, action: string, path: string, description: string][] = [
  ["candidates", "listActions", "candidates/{id}/actions", "List a candidate's actions."],
  ["candidates", "listPositionings", "candidates/{id}/positionings", "List a candidate's positionings."],
  ["candidates", "getTechnicalData", "candidates/{id}/technical-data", "Get a candidate's technical data (skills, tools, languages)."],
  ["resources", "listActions", "resources/{id}/actions", "List a resource's actions."],
  ["resources", "listPositionings", "resources/{id}/positionings", "List a resource's positionings."],
  ["resources", "listProjects", "resources/{id}/projects", "List the projects a resource works on."],
  ["resources", "listTimesReports", "resources/{id}/times-reports", "List a resource's time reports."],
  ["resources", "listExpensesReports", "resources/{id}/expenses-reports", "List a resource's expense reports."],
  ["resources", "listAbsencesReports", "resources/{id}/absences-reports", "List a resource's absence reports."],
  ["resources", "getTechnicalData", "resources/{id}/technical-data", "Get a resource's technical data (skills, tools, languages)."],
  ["contacts", "listActions", "contacts/{id}/actions", "List a contact's actions."],
  ["contacts", "listOpportunities", "contacts/{id}/opportunities", "List a contact's opportunities."],
  ["contacts", "listProjects", "contacts/{id}/projects", "List a contact's projects."],
  ["contacts", "listOrders", "contacts/{id}/orders", "List a contact's orders."],
  ["contacts", "listInvoices", "contacts/{id}/invoices", "List a contact's invoices."],
  ["companies", "listContacts", "companies/{id}/contacts", "List a company's contacts."],
  ["companies", "listActions", "companies/{id}/actions", "List a company's actions."],
  ["companies", "listOpportunities", "companies/{id}/opportunities", "List a company's opportunities."],
  ["companies", "listProjects", "companies/{id}/projects", "List a company's projects."],
  ["companies", "listOrders", "companies/{id}/orders", "List a company's orders."],
  ["companies", "listInvoices", "companies/{id}/invoices", "List a company's invoices."],
  ["opportunities", "listPositionings", "opportunities/{id}/positionings", "List an opportunity's positionings."],
  ["opportunities", "listActions", "opportunities/{id}/actions", "List an opportunity's actions."],
  ["opportunities", "listProjects", "opportunities/{id}/projects", "List the projects created from an opportunity."],
  ["projects", "listOrders", "projects/{id}/orders", "List a project's orders."],
  ["projects", "listActions", "projects/{id}/actions", "List a project's actions."],
  ["projects", "listPurchases", "projects/{id}/purchases", "List a project's purchases."],
  ["orders", "listInvoices", "orders/{id}/invoices", "List an order's invoices."],
  ["orders", "listActions", "orders/{id}/actions", "List an order's actions."],
  ["invoices", "listActions", "invoices/{id}/actions", "List an invoice's actions."],
  ["invoices", "listBillableItems", "invoices/{id}/billable-items", "List an invoice's billable items."],
];
for (const [group, action, path, description] of related) row(group, action, "GET", `/${path}`, description, "get");

// Workflow steps on reports and invoices.
for (const [group, path, noun] of [
  ["timesReports", "times-reports", "time report"],
  ["expensesReports", "expenses-reports", "expense report"],
  ["absencesReports", "absences-reports", "absence report"],
] as const) {
  row(group, "validate", "POST", `/${path}/{id}/validate`, `Validate a ${noun}. Optional body per the Boond documentation.`, "action");
  row(group, "unvalidate", "POST", `/${path}/{id}/unvalidate`, `Cancel the validation of a ${noun}.`, "action");
  row(group, "reject", "POST", `/${path}/{id}/reject`, `Reject a ${noun}. body is a JSON:API document with the rejection reason.`, "action");
}
row("expensesReports", "pay", "POST", "/expenses-reports/{id}/pay", "Mark an expense report as paid. Optional body per the Boond documentation.", "action");
row("invoices", "send", "POST", "/invoices/{id}/send", "Send an invoice by email. body is a JSON:API document with the recipients and message.", "action");

// Cross-entity and application reads.
row("times", "list", "GET", "/times", `List declared time entries. ${listNote}`, "list");
row("expenses", "list", "GET", "/expenses", `List declared expenses. ${listNote}`, "list");
row("absences", "list", "GET", "/absences", `List declared absences. ${listNote}`, "list");
row("flags", "list", "GET", "/application/flags", "List the flags (tags) users have defined.", "get");
row("reporting", "companies", "GET", "/reporting-companies", "Reporting by company. Needs startDate and endDate (YYYY-MM-DD) in query.", "list");
row("reporting", "projects", "GET", "/reporting-projects", "Reporting by project. Needs startDate and endDate (YYYY-MM-DD) in query.", "list");
row("reporting", "resources", "GET", "/reporting-resources", "Reporting by resource. Needs startDate and endDate (YYYY-MM-DD) in query.", "list");
row("reporting", "synthesis", "GET", "/reporting-synthesis", "Synthesis reporting. Needs startDate and endDate (YYYY-MM-DD) in query.", "list");
row("reporting", "productionPlans", "GET", "/reporting-production-plans", "Production plan reporting. Needs startDate and endDate (YYYY-MM-DD) in query.", "list");
row("billing", "monthlyBalance", "GET", "/billing-monthly-balance", "Monthly billing balance. Needs startDate and endDate (YYYY-MM-DD) in query.", "list");
row("billing", "projectsBalance", "GET", "/billing-projects-balance", "Billing balance by project. Needs startDate and endDate (YYYY-MM-DD) in query.", "list");
row("billing", "schedulesBalance", "GET", "/billing-schedules-balance", "Billing balance by schedule. Needs startDate and endDate (YYYY-MM-DD) in query.", "list");
row("billing", "details", "GET", "/billing-details", `List billing details. ${listNote}`, "list");
row("application", "currentUser", "GET", "/application/current-user", "Get the signed-in user and the Boond version.", "get");
row("application", "dictionary", "GET", "/application/dictionary", "Get the settings dictionary: the ids behind states, types, activity areas, tools and every other setting.", "get");
row("application", "settings", "GET", "/application/settings", "Get the application settings.", "get");
row("application", "perimeters", "GET", "/application/perimeters", "List the agencies, poles, business units and managers the current user can see.", "get");
row("application", "status", "GET", "/application/status", "Get the application status.", "get");
row("application", "weekendAndBankHolidays", "GET", "/application/weekendAndBankHolidays", "List weekends and bank holidays.", "get");
row("application", "listAssignments", "GET", "/application/assignments", "List the current user's assignments.", "get");
row("accounts", "list", "GET", "/accounts", `List user accounts. ${listNote}`, "list");
row("accounts", "get", "GET", "/accounts/{id}", "Get a user account.", "get");
row("calendars", "list", "GET", "/calendars", `List calendars. ${listNote}`, "list");
row("calendars", "get", "GET", "/calendars/{id}", "Get a calendar.", "get");
row("documents", "list", "GET", "/documents", `List documents. ${listNote}`, "list");
row("webhooks", "list", "GET", "/webhooks", "List webhooks.", "get");
row("webhooks", "create", "POST", "/webhooks", "Create a webhook. body is a JSON:API document.", "body");
row("webhooks", "delete", "DELETE", "/webhooks/{id}", "Delete a webhook.", "get");


function schemaFor(path: string, kind: Kind) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [, name] of path.matchAll(/\{(\w+)\}/g)) shape[name!] = string();
  if (kind === "list") {
    shape.page = number().optional();
    shape.maxResults = number().optional();
    shape.keywords = string().optional();
    shape.sort = string().optional();
    shape.order = string().optional();
  }
  if (kind !== "body" && kind !== "action") {
    shape.query = json().optional();
  } else if (kind === "body") {
    shape.body = json();
  } else {
    shape.body = json().optional();
  }
  return object(shape);
}

function describe(description: string, kind: Kind, path: string): string {
  const params: string[] = [];
  for (const [, name] of path.matchAll(/\{(\w+)\}/g)) params.push(`- ${name} (string, required): the record's identifier`);
  if (kind === "list") {
    params.push("- page, maxResults (number): paging");
    params.push("- keywords (string): search text");
    params.push("- sort (string, comma separated columns), order (asc or desc)");
  }
  if (kind === "get" || kind === "list") params.push("- query (object): other query parameters, such as { states: [1, 2], period: \"created\", startDate: \"2026-01-01\", endDate: \"2026-01-31\" }");
  return params.length === 0 ? description : `${description}\n\nParameters:\n${params.join("\n")}`;
}

function buildRouter(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: Method, path: string, input: Record<string, unknown>) => {
    let target = path;
    for (const [, name] of path.matchAll(/\{(\w+)\}/g)) {
      target = target.replace(`{${name}}`, encodeURIComponent(String(input[name!])));
    }
    const params = new URLSearchParams();
    const put = (key: string, value: unknown) => {
      if (value === undefined || value === null) return;
      params.set(key, Array.isArray(value) ? value.join(",") : String(value));
    };
    for (const key of ["page", "maxResults", "keywords", "sort", "order"]) put(key, input[key]);
    if (typeof input.query === "object" && input.query !== null) {
      for (const [key, value] of Object.entries(input.query as Record<string, unknown>)) put(key, value);
    }
    const hasBody = input.body !== undefined && input.body !== null;
    const response = await fetcher(`${base}${target}${params.size > 0 ? `?${params.toString()}` : ""}`, {
      method,
      signal,
      headers: {
        ...(await authHeaders(account)),
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(input.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`BoondManager answered ${response.status}: ${text.slice(0, 1500)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [group, action, method, path, description, kind] of rows) {
    const options = { description: describe(description, kind, path), input: schemaFor(path, kind) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const tools = groups.get(group) ?? {};
    tools[action] = tool;
    groups.set(group, tools);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { boondmanager: boond.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.boondmanager ?? [],
        (account) =>
          withApprovals(buildRouter(toAccount(account as never), fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "BoondManager",
        description:
          "BoondManager ERP/CRM for IT services firms: candidates, resources, companies, contacts, opportunities, projects, orders, invoices, positionings, time, expense and absence reports.",
        instructions:
          "Responses and request bodies are JSON:API documents ({ data: { id, type, attributes, relationships } }). Setting values (states, types, areas) are ids; look them up with application.dictionary. Before create, read the entity's getDefault for the expected shape. Lists page with page and maxResults and accept filters in query; list filter values are comma separated. The API only serves what the account's role may see.",
        icons,
      },
    ),
  }),
);
