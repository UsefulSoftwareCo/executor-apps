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

type Fetch = typeof fetch;
type Fields = { hostname: string; clientId: string; clientSecret: string; tenant?: string | undefined };
type Account = { fields: Fields };

// Every Halo instance has its own host under a Halo-hosted domain (example.halopsa.com). Executor only releases the client secret to the declared `hosts`.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Halo hostname, for example example.halopsa.com.");
  }
  if (url.protocol !== "https:") throw new Error("Halo must be reached over https.");
  if (url.pathname.replace(/\/+$/, "") !== "" && url.pathname.replace(/\/+$/, "") !== "/api")
    throw new Error("Enter only the Halo hostname, with no path.");
  return url.origin;
}

// Client credentials grant against {host}/auth/token, with the application's client id and secret in the form body.
async function mintToken(account: Account, fetcher: Fetch, signal: AbortSignal | undefined): Promise<string> {
  const { hostname, clientId, clientSecret, tenant } = account.fields;
  const tenantQuery = tenant !== undefined && tenant.trim() !== "" ? `?tenant=${encodeURIComponent(tenant.trim())}` : "";
  const response = await fetcher(`${originOf(hostname)}/auth/token${tenantQuery}`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "all",
    }).toString(),
  });
  const parsed = await decodeJson(response, object({ access_token: string() }));
  return parsed.access_token;
}

const halopsa = defineProvider({
  name: "Halo PSA",
  hosts: ["*.halopsa.com", "*.haloitsm.com", "*.haloservicedesk.com"],
  auth: {
    // Configuration > Integrations > Halo API > View Applications > New, with "Client ID and Secret (Services)".
    // The secret stays a handle (not raw): Executor substitutes it in the form body only on the declared hosts.
    clientCredentials: secrets({
      label: "API application (client credentials)",
      fields: object({
        hostname: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
        tenant: plain(string()).optional(),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.hostname);
    const token = await mintToken(account, fetch, signal);
    const response = await fetch(`${origin}/api/Agent/me`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return {
      accountInfo: { externalId: `${origin}:${account.fields.clientId}`, displayName: new URL(origin).host, profileUrl: origin },
    };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string): Field => [name, "string", false, "query"];
const n = (name: string): Field => [name, "number", false, "query"];
const b = (name: string): Field => [name, "boolean", false, "query"];

// Halo list endpoints share paging, ordering and search parameters.
const page: Field[] = [b("pageinate"), n("page_size"), n("page_no"), s("order"), b("orderdesc"), s("search"), b("count_only")];
const one: Field[] = [b("includedetails")];

type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "DELETE",
  path: string,
  description: string,
  fields: Field[],
  hasBody?: boolean,
];

const listNote =
  "Set pageinate true with page_size and page_no to page; order/orderdesc sort; search is a free-text filter. Responses carry record_count and the list of records.";
const writeNote =
  "body is the JSON array of objects Halo expects (https://halo.haloservicedesk.com/apidoc/info); include the id of an existing record to update it, omit it to create.";

const rows: Row[] = [
  // Tickets
  ["tickets", "list", "GET", "/Tickets", `List tickets. ${listNote} Filters: open_only, closed_only, client_id, site_id, user_id, agent_id, team, status_id, tickettype_id, requesttype, priority_id, ticketidonly, view_id, includecolumns, excludethese, ticketids, datesearch, startdate, enddate.`, [...page, b("open_only"), b("closed_only"), n("client_id"), n("site_id"), n("user_id"), n("agent_id"), s("team"), n("status_id"), n("tickettype_id"), n("priority_id"), n("view_id"), s("startdate"), s("enddate"), s("datesearch")]],
  ["tickets", "get", "GET", "/Tickets/{id}", "Retrieve a ticket. Set includedetails true for the full ticket, includelastaction for its latest action.", [...one, b("includelastaction"), b("ticketidonly")]],
  ["tickets", "save", "POST", "/Tickets", `Create or update tickets. ${writeNote} Typical create: [{ "summary": "...", "details": "...", "tickettype_id": 1, "client_id": 12, "user_id": 3 }].`, [], true],
  ["tickets", "delete", "DELETE", "/Tickets/{id}", "Delete a ticket.", []],
  ["tickets", "listTypes", "GET", "/TicketType", `List ticket types. ${listNote}`, page],
  ["tickets", "getType", "GET", "/TicketType/{id}", "Retrieve a ticket type.", one],
  ["tickets", "saveType", "POST", "/TicketType", `Create or update ticket types. ${writeNote}`, [], true],
  ["tickets", "listStatuses", "GET", "/Status", `List ticket statuses. ${listNote}`, page],
  ["tickets", "getStatus", "GET", "/Status/{id}", "Retrieve a ticket status.", one],
  ["tickets", "listPriorities", "GET", "/Priority", `List priorities. ${listNote}`, page],
  ["tickets", "listCategories", "GET", "/Category", `List categories. ${listNote}`, page],
  ["tickets", "listSlas", "GET", "/SLA", `List SLAs. ${listNote}`, page],
  ["tickets", "listViews", "GET", "/Views", `List ticket views. ${listNote}`, page],

  // Actions (notes, replies, time)
  ["actions", "list", "GET", "/Actions", `List actions (notes, replies and time entries). ${listNote} Filters: ticket_id, agent_id, excludesys, conversationonly, startdate, enddate.`, [...page, n("ticket_id"), n("agent_id"), b("excludesys"), b("conversationonly"), s("startdate"), s("enddate")]],
  ["actions", "get", "GET", "/Actions/{id}", "Retrieve an action. ticket_id is required by Halo.", [...one, n("ticket_id")]],
  ["actions", "save", "POST", "/Actions", `Create or update actions. ${writeNote} Typical add note: [{ "ticket_id": 123, "note": "...", "outcome": "note", "hiddenfromuser": true, "timetaken": 0.5 }].`, [], true],
  ["actions", "delete", "DELETE", "/Actions/{id}", "Delete an action.", []],

  // Clients, sites, users
  ["clients", "list", "GET", "/Client", `List clients (customers). ${listNote} Filters: toplevel_id, includeactive, includeinactive.`, [...page, n("toplevel_id"), b("includeactive"), b("includeinactive")]],
  ["clients", "get", "GET", "/Client/{id}", "Retrieve a client.", one],
  ["clients", "save", "POST", "/Client", `Create or update clients. ${writeNote}`, [], true],
  ["clients", "delete", "DELETE", "/Client/{id}", "Delete a client.", []],
  ["sites", "list", "GET", "/Site", `List sites. ${listNote} Filters: client_id, includeactive, includeinactive.`, [...page, n("client_id"), b("includeactive"), b("includeinactive")]],
  ["sites", "get", "GET", "/Site/{id}", "Retrieve a site.", one],
  ["sites", "save", "POST", "/Site", `Create or update sites. ${writeNote}`, [], true],
  ["sites", "delete", "DELETE", "/Site/{id}", "Delete a site.", []],
  ["users", "list", "GET", "/Users", `List end users (customer contacts). ${listNote} Filters: client_id, site_id, organisation_id, includeactive, includeinactive.`, [...page, n("client_id"), n("site_id"), n("organisation_id"), b("includeactive"), b("includeinactive")]],
  ["users", "get", "GET", "/Users/{id}", "Retrieve an end user.", one],
  ["users", "save", "POST", "/Users", `Create or update end users. ${writeNote}`, [], true],
  ["users", "delete", "DELETE", "/Users/{id}", "Delete an end user.", []],

  // Agents and teams
  ["agents", "me", "GET", "/Agent/me", "Retrieve the agent the application acts as.", []],
  ["agents", "list", "GET", "/Agent", `List agents (staff). ${listNote} Filters: team_id, includeenabled, includedisabled.`, [...page, n("team_id"), b("includeenabled"), b("includedisabled")]],
  ["agents", "get", "GET", "/Agent/{id}", "Retrieve an agent.", one],
  ["agents", "save", "POST", "/Agent", `Create or update agents. ${writeNote}`, [], true],
  ["agents", "delete", "DELETE", "/Agent/{id}", "Delete an agent.", []],
  ["teams", "list", "GET", "/Team", `List teams. ${listNote}`, page],
  ["teams", "get", "GET", "/Team/{id}", "Retrieve a team.", one],
  ["teams", "save", "POST", "/Team", `Create or update teams. ${writeNote}`, [], true],
  ["teams", "delete", "DELETE", "/Team/{id}", "Delete a team.", []],

  // Assets
  ["assets", "list", "GET", "/Asset", `List assets (configuration items). ${listNote} Filters: client_id, site_id, user_id, assettype_id, ticket_id, includeinactive.`, [...page, n("client_id"), n("site_id"), n("user_id"), n("assettype_id"), n("ticket_id"), b("includeinactive")]],
  ["assets", "get", "GET", "/Asset/{id}", "Retrieve an asset.", one],
  ["assets", "save", "POST", "/Asset", `Create or update assets. ${writeNote}`, [], true],
  ["assets", "delete", "DELETE", "/Asset/{id}", "Delete an asset.", []],
  ["assets", "listTypes", "GET", "/AssetType", `List asset types. ${listNote}`, page],

  // Projects and appointments
  ["projects", "list", "GET", "/Projects", `List projects. ${listNote} Filters: client_id, includecompleted.`, [...page, n("client_id"), b("includecompleted")]],
  ["projects", "get", "GET", "/Projects/{id}", "Retrieve a project.", one],
  ["projects", "save", "POST", "/Projects", `Create or update projects. ${writeNote}`, [], true],
  ["projects", "delete", "DELETE", "/Projects/{id}", "Delete a project.", []],
  ["appointments", "list", "GET", "/Appointment", `List appointments. ${listNote} Filters: agent_id, ticket_id, startdate, enddate.`, [...page, n("agent_id"), n("ticket_id"), s("startdate"), s("enddate")]],
  ["appointments", "get", "GET", "/Appointment/{id}", "Retrieve an appointment.", one],
  ["appointments", "save", "POST", "/Appointment", `Create or update appointments. ${writeNote}`, [], true],
  ["appointments", "delete", "DELETE", "/Appointment/{id}", "Delete an appointment.", []],

  // Sales and billing
  ["opportunities", "list", "GET", "/Opportunities", `List opportunities. ${listNote} Filters: client_id, agent_id, open_only.`, [...page, n("client_id"), n("agent_id"), b("open_only")]],
  ["opportunities", "get", "GET", "/Opportunities/{id}", "Retrieve an opportunity.", one],
  ["opportunities", "save", "POST", "/Opportunities", `Create or update opportunities. ${writeNote}`, [], true],
  ["opportunities", "delete", "DELETE", "/Opportunities/{id}", "Delete an opportunity.", []],
  ["quotations", "list", "GET", "/Quotation", `List quotations. ${listNote} Filters: client_id, ticket_id.`, [...page, n("client_id"), n("ticket_id")]],
  ["quotations", "get", "GET", "/Quotation/{id}", "Retrieve a quotation.", one],
  ["quotations", "save", "POST", "/Quotation", `Create or update quotations. ${writeNote}`, [], true],
  ["quotations", "delete", "DELETE", "/Quotation/{id}", "Delete a quotation.", []],
  ["invoices", "list", "GET", "/Invoice", `List invoices. ${listNote} Filters: client_id, ticket_id, includelines, startdate, enddate.`, [...page, n("client_id"), n("ticket_id"), b("includelines"), s("startdate"), s("enddate")]],
  ["invoices", "get", "GET", "/Invoice/{id}", "Retrieve an invoice.", [...one, b("includelines")]],
  ["invoices", "save", "POST", "/Invoice", `Create or update invoices. ${writeNote}`, [], true],
  ["invoices", "delete", "DELETE", "/Invoice/{id}", "Delete an invoice.", []],
  ["contracts", "list", "GET", "/ClientContract", `List client contracts. ${listNote} Filters: client_id, site_id, includeinactive.`, [...page, n("client_id"), n("site_id"), b("includeinactive")]],
  ["contracts", "get", "GET", "/ClientContract/{id}", "Retrieve a client contract.", one],
  ["contracts", "save", "POST", "/ClientContract", `Create or update client contracts. ${writeNote}`, [], true],
  ["contracts", "delete", "DELETE", "/ClientContract/{id}", "Delete a client contract.", []],
  ["items", "list", "GET", "/Item", `List items (products and services). ${listNote} Filters: supplier_id, includeinactive.`, [...page, n("supplier_id"), b("includeinactive")]],
  ["items", "get", "GET", "/Item/{id}", "Retrieve an item.", one],
  ["items", "save", "POST", "/Item", `Create or update items. ${writeNote}`, [], true],
  ["items", "delete", "DELETE", "/Item/{id}", "Delete an item.", []],
  ["suppliers", "list", "GET", "/Supplier", `List suppliers. ${listNote}`, page],
  ["suppliers", "get", "GET", "/Supplier/{id}", "Retrieve a supplier.", one],
  ["suppliers", "save", "POST", "/Supplier", `Create or update suppliers. ${writeNote}`, [], true],
  ["suppliers", "delete", "DELETE", "/Supplier/{id}", "Delete a supplier.", []],

  // Knowledge base, attachments, reports
  ["knowledgeBase", "list", "GET", "/KBArticle", `List knowledge base articles. ${listNote}`, page],
  ["knowledgeBase", "get", "GET", "/KBArticle/{id}", "Retrieve a knowledge base article.", one],
  ["knowledgeBase", "save", "POST", "/KBArticle", `Create or update knowledge base articles. ${writeNote}`, [], true],
  ["knowledgeBase", "delete", "DELETE", "/KBArticle/{id}", "Delete a knowledge base article.", []],
  ["attachments", "list", "GET", "/Attachment", `List attachments. ${listNote} Filters: ticket_id, action_id, unique_id, type.`, [...page, n("ticket_id"), n("action_id"), s("unique_id"), n("type")]],
  ["attachments", "get", "GET", "/Attachment/{id}", "Retrieve attachment metadata.", one],
  ["attachments", "delete", "DELETE", "/Attachment/{id}", "Delete an attachment.", []],
  ["reports", "list", "GET", "/Report", `List reports. ${listNote}`, page],
  ["reports", "get", "GET", "/Report/{id}", "Retrieve a report definition, optionally with its data (loadreport true).", [...one, b("loadreport")]],
  ["reports", "run", "POST", "/Report", "Run a report. body is a JSON array like [{ \"id\": 123, \"loadreport\": true }] or [{ \"sql\": \"select ...\", \"loadreport\": true }] (read-only SQL).", [], true],
];

function fieldsOf(path: string, extra: Field[], hasBody: boolean | undefined): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1]!)
    .map((name): Field => [name, "number", true, "path"]);
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

function build(account: Account, fetcher: Fetch, signal: AbortSignal | undefined) {
  const origin = originOf(account.fields.hostname);
  let cached: { token: string; expires: number } | undefined;
  const bearer = async () => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const token = await mintToken(account, fetcher, signal);
    cached = { token, expires: Date.now() + 50 * 60 * 1000 };
    return token;
  };

  const call = async (method: string, path: string, fields: Field[], hasBody: boolean, input: Record<string, unknown>) => {
    let target = path;
    const params = new URLSearchParams();
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (name === "body" || value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else params.set(name, String(value));
    }
    const response = await fetcher(`${origin}/api${target}${params.size > 0 ? `?${params.toString()}` : ""}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${await bearer()}`,
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(input.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Halo answered ${response.status}: ${text.slice(0, 1000)}`);
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
  { user: { accounts: { halopsa: halopsa.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.halopsa ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Halo PSA",
        description:
          "Halo PSA service desk: tickets and actions, clients, sites, users, agents, teams, assets, projects, appointments, opportunities, quotations, invoices, contracts, items, suppliers, knowledge base, attachments and reports.",
        instructions:
          "Halo writes are POSTs of a JSON array: omit id to create, include id to update. Lists accept pageinate/page_size/page_no and return record_count plus a record array. What the API may do depends on the permissions of the API application's agent.",
        icons,
      },
    ),
  }),
);
