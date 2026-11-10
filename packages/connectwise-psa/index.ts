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

// ConnectWise PSA runs on regional cloud hosts (api-na.myconnectwise.net, api-eu..., api-au...,
// api-staging.connectwisedev.com). The API root is /v4_6_release/apis/3.0 on each.
function normalizeHost(raw: string): string {
  const host = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*\.(myconnectwise\.net|connectwisedev\.com)$/.test(host)) {
    throw new Error("Enter your ConnectWise cloud API host, for example api-na.myconnectwise.net.");
  }
  return host;
}

type Account = { fields: { hostname: string; companyId: string; publicKey: string; privateKey: string; clientId: string } };

const baseOf = (account: Account) => `https://${normalizeHost(account.fields.hostname)}/v4_6_release/apis/3.0`;

const headersOf = (account: Account): Record<string, string> => {
  const { companyId, publicKey, privateKey, clientId } = account.fields;
  return {
    Authorization: `Basic ${btoa(`${companyId.trim()}+${publicKey.trim()}:${privateKey}`)}`,
    clientId: clientId.trim(),
    Accept: "application/json",
  };
};

const connectwise = defineProvider({
  name: "ConnectWise PSA",
  hosts: ["*.myconnectwise.net", "*.connectwisedev.com"],
  auth: {
    apiKeys: secrets({
      label: "API member keys",
      fields: object({
        hostname: plain(string({ minLength: 1 })),
        companyId: plain(string({ minLength: 1 })),
        publicKey: plain(string({ minLength: 1 })),
        privateKey: string({ minLength: 1 }),
        clientId: plain(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${baseOf(account)}/system/info`, { signal, headers: headersOf(account) });
    await decodeJson(response, object({ version: string() }));
    return {
      accountInfo: {
        externalId: `${normalizeHost(account.fields.hostname)}/${account.fields.companyId}`,
        displayName: account.fields.companyId,
      },
    };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string, required = false): Field => [name, "string", required, "query"];
const n = (name: string): Field => [name, "number", false, "query"];

const list: Field[] = [s("conditions"), s("childConditions"), s("customFieldConditions"), s("orderBy"), n("page"), n("pageSize"), s("fields")];
const one: Field[] = [s("fields")];
const count: Field[] = [s("conditions"), s("childConditions"), s("customFieldConditions")];

type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  description: string,
  fields: Field[],
  hasBody?: boolean,
];

const listNote =
  "Pages with page and pageSize (default 25, max 1000); conditions is a ConnectWise expression such as status/name='Open' and board/id=1 (strings in quotes, dates in [2024-01-01T00:00:00Z]); orderBy is like 'id desc'; fields limits returned properties.";
const bodyNote = "body is the JSON object exactly as the ConnectWise REST reference documents it.";
const patchNote =
  "body is a JSON Patch array of operations, for example [{ op: 'replace', path: '/summary', value: 'New' }].";

// Resource, plural list endpoint, singular noun, create/update/delete flags.
type Crud = [resource: string, path: string, noun: string, create: boolean, update: boolean, remove: boolean, createNote?: string];

const crud: Crud[] = [
  ["tickets", "/service/tickets", "service ticket", true, true, true, "summary, board/id and company/id are the usual required fields"],
  ["ticketNotes", "/service/tickets/{parentId}/notes", "ticket note", true, true, true],
  ["ticketTimeEntries", "/service/tickets/{parentId}/timeentries", "ticket time entry", false, false, false],
  ["boards", "/service/boards", "service board", false, false, false],
  ["boardStatuses", "/service/boards/{parentId}/statuses", "board status", false, false, false],
  ["boardTypes", "/service/boards/{parentId}/types", "board type", false, false, false],
  ["boardSubtypes", "/service/boards/{parentId}/subtypes", "board subtype", false, false, false],
  ["boardTeams", "/service/boards/{parentId}/teams", "board team", false, false, false],
  ["priorities", "/service/priorities", "service priority", false, false, false],
  ["sources", "/service/sources", "service source", false, false, false],
  ["slas", "/service/slas", "SLA", false, false, false],
  ["companies", "/company/companies", "company", true, true, true, "name, identifier, status/id and types are required"],
  ["companyNotes", "/company/companies/{parentId}/notes", "company note", true, true, true],
  ["companySites", "/company/companies/{parentId}/sites", "company site", true, true, true],
  ["companyTypes", "/company/companies/types", "company type", false, false, false],
  ["companyStatuses", "/company/companies/statuses", "company status", false, false, false],
  ["contacts", "/company/contacts", "contact", true, true, true, "firstName and company/id are the usual required fields"],
  ["contactCommunications", "/company/contacts/{parentId}/communications", "contact communication item", true, true, true],
  ["projects", "/project/projects", "project", true, true, true, "name, board/id, company/id and estimatedStart/estimatedEnd are the usual required fields"],
  ["projectPhases", "/project/projects/{parentId}/phases", "project phase", true, true, true],
  ["projectTickets", "/project/tickets", "project ticket", true, true, true],
  ["projectStatuses", "/project/statuses", "project status", false, false, false],
  ["projectTypes", "/project/projectTypes", "project type", false, false, false],
  ["timeEntries", "/time/entries", "time entry", true, true, true, "chargeToId, chargeToType, member/id, timeStart/timeEnd or actualHours are the usual required fields"],
  ["agreements", "/finance/agreements", "agreement", true, true, true, "name, type/id, company/id and startDate are the usual required fields"],
  ["agreementAdditions", "/finance/agreements/{parentId}/additions", "agreement addition", true, true, true],
  ["agreementTypes", "/finance/agreements/types", "agreement type", false, false, false],
  ["invoices", "/finance/invoices", "invoice", false, true, false],
  ["expenseEntries", "/expense/entries", "expense entry", true, true, true],
  ["opportunities", "/sales/opportunities", "sales opportunity", true, true, true, "name, company/id, contact/id, status/id, type/id and primarySalesRep/id are the usual required fields"],
  ["opportunityNotes", "/sales/opportunities/{parentId}/notes", "opportunity note", true, true, true],
  ["opportunityStatuses", "/sales/opportunities/statuses", "opportunity status", false, false, false],
  ["opportunityTypes", "/sales/opportunities/types", "opportunity type", false, false, false],
  ["opportunityStages", "/sales/stages", "sales stage", false, false, false],
  ["activities", "/sales/activities", "sales activity", true, true, true],
  ["configurations", "/company/configurations", "configuration (asset)", true, true, true, "name, type/id, status/id and company/id are the usual required fields"],
  ["configurationTypes", "/company/configurations/types", "configuration type", false, false, false],
  ["configurationStatuses", "/company/configurations/statuses", "configuration status", false, false, false],
  ["catalogItems", "/procurement/catalog", "catalog item", true, true, true],
  ["products", "/procurement/products", "product", true, true, true],
  ["purchaseOrders", "/procurement/purchaseorders", "purchase order", false, true, false],
  ["manufacturers", "/procurement/manufacturers", "manufacturer", false, false, false],
  ["members", "/system/members", "member", false, true, false],
  ["departments", "/system/departments", "department", false, false, false],
  ["locations", "/system/locations", "location", false, false, false],
  ["callbacks", "/system/callbacks", "callback (webhook) registration", true, true, true, "url, objectId, type, level and description are required"],
  ["documents", "/system/documents", "document", false, false, true],
  ["workRoles", "/time/workRoles", "work role", false, false, false],
  ["workTypes", "/time/workTypes", "work type", false, false, false],
  ["schedules", "/schedule/entries", "schedule entry", true, true, true],
  ["calendars", "/schedule/calendars", "calendar", false, false, false],
  ["customFields", "/system/userDefinedFields", "custom field definition", false, false, false],
];

const rows: Row[] = [];
const label = (resource: string) => resource.replace(/([A-Z])/g, " $1").toLowerCase();
for (const [resource, rawPath, noun, create, update, remove, createNote] of crud) {
  const nested = rawPath.includes("{parentId}");
  const base = rawPath;
  const item = `${base}/{id}`;
  rows.push([resource, "list", "GET", base, `List ${noun} records. ${listNote}`, list]);
  rows.push([resource, "count", "GET", `${base}/count`, `Count ${noun} records matching conditions.`, count]);
  rows.push([resource, "get", "GET", item, `Retrieve one ${noun} by id.`, one]);
  if (create) rows.push([resource, "create", "POST", base, `Create a ${noun}${createNote ? ` (${createNote})` : ""}. ${bodyNote}`, [], true]);
  if (update) {
    rows.push([resource, "update", "PATCH", item, `Update a ${noun} with JSON Patch. ${patchNote}`, [], true]);
  }
  if (remove) rows.push([resource, "delete", "DELETE", item, `Delete a ${noun}.`, []]);
  void nested;
  void label;
}

rows.push(
  ["tickets", "replace", "PUT", "/service/tickets/{id}", `Replace a service ticket with a full object. ${bodyNote}`, [], true],
  ["companies", "replace", "PUT", "/company/companies/{id}", `Replace a company with a full object. ${bodyNote}`, [], true],
  ["contacts", "replace", "PUT", "/company/contacts/{id}", `Replace a contact with a full object. ${bodyNote}`, [], true],
  ["system", "info", "GET", "/system/info", "Retrieve the ConnectWise version, cloud region and server time zone.", []],
  ["system", "listMemberTypes", "GET", "/system/members/types", "List member types.", list],
  ["system", "listSecurityRoles", "GET", "/system/securityRoles", `List security roles. ${listNote}`, list],
  ["system", "listReports", "GET", "/system/reports", `List reports. ${listNote}`, list],
  ["system", "runReport", "GET", "/system/reports/{reportName}", "Run a report by name and return its rows.", [s("conditions"), n("page"), n("pageSize"), ["columns", "json", false, "query"]]],
  ["tickets", "listConfigurations", "GET", "/service/tickets/{id}/configurations", `List configurations attached to a ticket. ${listNote}`, list],
  ["tickets", "search", "POST", "/service/tickets/search", `Search tickets with a JSON body of conditions, for filters too long for a query string. ${bodyNote}`, [], true],
  ["companies", "search", "POST", "/company/companies/search", `Search companies with a JSON body of conditions. ${bodyNote}`, [], true],
  ["contacts", "search", "POST", "/company/contacts/search", `Search contacts with a JSON body of conditions. ${bodyNote}`, [], true],
);

function fieldsOf(path: string, extra: Field[], hasBody: boolean | undefined): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1]!)
    .filter((name) => !extra.some(([known]) => known === name))
    .map((name) => [name, name === "id" || name === "parentId" ? "number" : "string", true, "path"]);
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

function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

// ConnectWise answers POST search and report calls as reads; they change nothing.
const isRead = (method: string, action: string) => method === "GET" || action === "search";

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, fields: Field[], hasBody: boolean, input: Record<string, unknown>) => {
    let target = path;
    const params = new URLSearchParams();
    for (const [name, type, , where] of fields) {
      const value = input[name];
      if (name === "body" || value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else params.set(name, type === "json" ? JSON.stringify(value) : String(value));
    }
    const url = `${baseOf(account)}${target}${params.size > 0 ? `?${params.toString()}` : ""}`;
    const response = await fetcher(url, {
      method,
      signal,
      headers: { ...headersOf(account), ...(hasBody ? { "Content-Type": "application/json" } : {}) },
      body: hasBody ? JSON.stringify(input.body ?? {}) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`ConnectWise answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra, hasBody] of rows) {
    const fields = fieldsOf(path, extra, hasBody);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, hasBody === true, input);
    const tool = isRead(method, action) ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { connectwisePsa: connectwise.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.connectwisePsa ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ConnectWise PSA",
        description:
          "ConnectWise PSA (Manage): service tickets and boards, projects, companies, contacts, time and expense entries, agreements, invoices, opportunities, configurations, procurement, members and system lookups.",
        instructions:
          "Lists take conditions (for example summary contains 'printer' and board/id=1), orderBy, page and pageSize. Nested resources (notes, sites, statuses and the like) take the parent record's id as parentId. Updates use JSON Patch arrays; creates and replaces use full JSON objects.",
        icons,
      },
    ),
  }),
);
