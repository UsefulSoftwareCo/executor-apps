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

// Every Kommo account lives on its own host: https://<subdomain>.kommo.com.
function normalizeSubdomain(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*)(?:\.kommo\.com)?\/?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter the <subdomain> of <subdomain>.kommo.com (letters, digits, hyphens).");
  return match[1]!;
}

const AccountInfo = object({ id: number(), name: string(), subdomain: string() });

type Account = { fields: { subdomain: string; token: string } };

const originOf = (account: Account) => `https://${normalizeSubdomain(account.fields.subdomain)}.kommo.com`;

const kommo = defineProvider({
  name: "Kommo",
  hosts: ["*.kommo.com"],
  auth: {
    // OAuth is not offered: the token endpoint is per account (<subdomain>.kommo.com/oauth2/access_token)
    // and the framework declares tokenUrl as a static string. The long-lived token of a private
    // integration is the supported alternative.
    token: secrets({
      label: "Long-lived token",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account);
    const response = await fetch(`${origin}/api/v4/account`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const info = await decodeJson(response, AccountInfo);
    return {
      accountInfo: { externalId: String(info.id), displayName: info.name, profileUrl: origin },
    };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Where = "path" | "query";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string, required = false): Field => [name, "string", required, "query"];
const n = (name: string): Field => [name, "number", false, "query"];
const j = (name: string): Field => [name, "json", false, "query"];

// Kommo's list endpoints share paging, ordering and `with` expansion.
const list: Field[] = [n("page"), n("limit"), s("with"), s("query"), j("filter"), j("order")];

// A write sends `body` exactly as given: an object for one entity, an array for a batch.
type Row = [
  resource: string,
  action: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  description: string,
  fields: Field[],
  hasBody?: boolean,
];

const W = true;
const doc = "Body is sent as Kommo documents it (https://developers.kommo.com/reference).";
const entityTypeNote = "entity_type is leads, contacts or companies.";

const rows: Row[] = [
  // Account
  ["account", "get", "GET", "/api/v4/account", "Account details. with can include amojo_id, amojo_rights, users_groups, task_types, version, entity_names, datetime_settings, drive_url, is_api_filter_enabled.", [s("with")]],

  // Leads
  ["leads", "list", "GET", "/api/v4/leads", "List leads. with can include contacts, loss_reason, source_id, catalog_elements. filter and order are objects, for example filter {statuses: [{pipeline_id, status_id}], created_at: {from, to}}, order {updated_at: \"desc\"}.", list],
  ["leads", "get", "GET", "/api/v4/leads/{id}", "Retrieve a lead.", [s("with")]],
  ["leads", "create", "POST", "/api/v4/leads", `Add leads. Body is an array of lead objects. ${doc}`, [], W],
  ["leads", "createComplex", "POST", "/api/v4/leads/complex", `Add leads together with their contacts and company in one request (array body, duplicate control applies). ${doc}`, [], W],
  ["leads", "update", "PATCH", "/api/v4/leads", `Update several leads. Body is an array of lead objects each with an id. ${doc}`, [], W],
  ["leads", "updateOne", "PATCH", "/api/v4/leads/{id}", `Update one lead. ${doc}`, [], W],
  ["leads", "lossReasons", "GET", "/api/v4/leads/loss_reasons", "List lead loss reasons.", [n("page"), n("limit")]],
  ["leads", "lossReason", "GET", "/api/v4/leads/loss_reasons/{id}", "Retrieve a loss reason.", []],
  ["leads", "subscribers", "GET", "/api/v4/leads/{id}/subscriptions", "List subscribers of a lead.", [n("page"), n("limit")]],

  // Pipelines and stages
  ["pipelines", "list", "GET", "/api/v4/leads/pipelines", "List lead pipelines with their stages.", []],
  ["pipelines", "get", "GET", "/api/v4/leads/pipelines/{id}", "Retrieve a pipeline.", []],
  ["pipelines", "create", "POST", "/api/v4/leads/pipelines", `Add pipelines. ${doc}`, [], W],
  ["pipelines", "update", "PATCH", "/api/v4/leads/pipelines/{id}", `Edit a pipeline. ${doc}`, [], W],
  ["pipelines", "delete", "DELETE", "/api/v4/leads/pipelines/{id}", "Delete a pipeline.", []],
  ["pipelines", "stages", "GET", "/api/v4/leads/pipelines/{pipeline_id}/statuses", "List the stages of a pipeline.", []],
  ["pipelines", "stage", "GET", "/api/v4/leads/pipelines/{pipeline_id}/statuses/{id}", "Retrieve a pipeline stage.", []],
  ["pipelines", "createStages", "POST", "/api/v4/leads/pipelines/{pipeline_id}/statuses", `Add stages to a pipeline. ${doc}`, [], W],
  ["pipelines", "updateStage", "PATCH", "/api/v4/leads/pipelines/{pipeline_id}/statuses/{id}", `Edit a pipeline stage. ${doc}`, [], W],
  ["pipelines", "deleteStage", "DELETE", "/api/v4/leads/pipelines/{pipeline_id}/statuses/{id}", "Delete a pipeline stage.", []],

  // Incoming leads
  ["incomingLeads", "list", "GET", "/api/v4/leads/unsorted", "List incoming (unsorted) leads.", [n("page"), n("limit"), j("filter"), j("order")]],
  ["incomingLeads", "get", "GET", "/api/v4/leads/unsorted/{uid}", "Retrieve an incoming lead by UID.", []],
  ["incomingLeads", "createFromCall", "POST", "/api/v4/leads/unsorted/sip", `Add incoming leads of type sip (call). ${doc}`, [], W],
  ["incomingLeads", "createFromForm", "POST", "/api/v4/leads/unsorted/forms", `Add incoming leads of type form. ${doc}`, [], W],
  ["incomingLeads", "accept", "POST", "/api/v4/leads/unsorted/{uid}/accept", `Accept an incoming lead. ${doc}`, [], W],
  ["incomingLeads", "decline", "DELETE", "/api/v4/leads/unsorted/{uid}/decline", "Decline an incoming lead.", []],
  ["incomingLeads", "link", "POST", "/api/v4/leads/unsorted/{uid}/link", `Link an incoming lead to an existing lead. ${doc}`, [], W],
  ["incomingLeads", "summary", "GET", "/api/v4/leads/unsorted/summary", "Summary counts of incoming leads.", [j("filter")]],

  // Contacts
  ["contacts", "list", "GET", "/api/v4/contacts", "List contacts. with can include leads, customers, catalog_elements.", list],
  ["contacts", "get", "GET", "/api/v4/contacts/{id}", "Retrieve a contact.", [s("with")]],
  ["contacts", "create", "POST", "/api/v4/contacts", `Add contacts. Body is an array. ${doc}`, [], W],
  ["contacts", "update", "PATCH", "/api/v4/contacts", `Update several contacts. Body is an array of objects each with an id. ${doc}`, [], W],
  ["contacts", "updateOne", "PATCH", "/api/v4/contacts/{id}", `Update one contact. ${doc}`, [], W],

  // Companies
  ["companies", "list", "GET", "/api/v4/companies", "List companies. with can include leads, contacts, customers, catalog_elements.", list],
  ["companies", "get", "GET", "/api/v4/companies/{id}", "Retrieve a company.", [s("with")]],
  ["companies", "create", "POST", "/api/v4/companies", `Add companies. Body is an array. ${doc}`, [], W],
  ["companies", "update", "PATCH", "/api/v4/companies", `Update several companies. Body is an array of objects each with an id. ${doc}`, [], W],
  ["companies", "updateOne", "PATCH", "/api/v4/companies/{id}", `Update one company. ${doc}`, [], W],

  // Lists (catalogs)
  ["catalogs", "list", "GET", "/api/v4/catalogs", "List catalogs (lists).", [n("page"), n("limit")]],
  ["catalogs", "get", "GET", "/api/v4/catalogs/{id}", "Retrieve a catalog.", []],
  ["catalogs", "create", "POST", "/api/v4/catalogs", `Add catalogs. ${doc}`, [], W],
  ["catalogs", "update", "PATCH", "/api/v4/catalogs", `Edit several catalogs. ${doc}`, [], W],
  ["catalogs", "updateOne", "PATCH", "/api/v4/catalogs/{id}", `Edit one catalog. ${doc}`, [], W],
  ["catalogs", "elements", "GET", "/api/v4/catalogs/{catalog_id}/elements", "List the elements of a catalog.", [n("page"), n("limit"), j("filter")]],
  ["catalogs", "element", "GET", "/api/v4/catalogs/{catalog_id}/elements/{id}", "Retrieve a catalog element.", []],
  ["catalogs", "createElements", "POST", "/api/v4/catalogs/{catalog_id}/elements", `Add catalog elements. ${doc}`, [], W],
  ["catalogs", "updateElements", "PATCH", "/api/v4/catalogs/{catalog_id}/elements", `Edit several catalog elements. ${doc}`, [], W],
  ["catalogs", "updateElement", "PATCH", "/api/v4/catalogs/{catalog_id}/elements/{id}", `Edit one catalog element. ${doc}`, [], W],

  // Custom fields
  ["customFields", "list", "GET", "/api/v4/{entity_type}/custom_fields", `List custom fields of an entity. ${entityTypeNote}`, [n("page"), n("limit"), j("filter")]],
  ["customFields", "get", "GET", "/api/v4/{entity_type}/custom_fields/{id}", `Retrieve a custom field. ${entityTypeNote}`, []],
  ["customFields", "create", "POST", "/api/v4/{entity_type}/custom_fields", `Add custom fields. ${entityTypeNote} ${doc}`, [], W],
  ["customFields", "update", "PATCH", "/api/v4/{entity_type}/custom_fields", `Update several custom fields. ${entityTypeNote} ${doc}`, [], W],
  ["customFields", "updateOne", "PATCH", "/api/v4/{entity_type}/custom_fields/{id}", `Update one custom field. ${entityTypeNote} ${doc}`, [], W],
  ["customFields", "delete", "DELETE", "/api/v4/{entity_type}/custom_fields/{id}", `Delete a custom field. ${entityTypeNote}`, []],
  ["customFields", "groups", "GET", "/api/v4/{entity_type}/custom_fields/groups", `List custom field groups. ${entityTypeNote}`, []],
  ["customFields", "group", "GET", "/api/v4/{entity_type}/custom_fields/groups/{id}", `Retrieve a custom field group. ${entityTypeNote}`, []],
  ["customFields", "createGroups", "POST", "/api/v4/{entity_type}/custom_fields/groups", `Add custom field groups. ${entityTypeNote} ${doc}`, [], W],
  ["customFields", "updateGroup", "PATCH", "/api/v4/{entity_type}/custom_fields/groups/{id}", `Edit a custom field group. ${entityTypeNote} ${doc}`, [], W],
  ["customFields", "deleteGroup", "DELETE", "/api/v4/{entity_type}/custom_fields/groups/{id}", `Delete a custom field group. ${entityTypeNote}`, []],
  ["customFields", "catalogFields", "GET", "/api/v4/catalogs/{catalog_id}/custom_fields", "List custom fields of a catalog.", [n("page"), n("limit")]],
  ["customFields", "createCatalogFields", "POST", "/api/v4/catalogs/{catalog_id}/custom_fields", `Add custom fields to a catalog. ${doc}`, [], W],

  // Users and roles
  ["users", "list", "GET", "/api/v4/users", "List users. with can include role, group, uuid, amojo_id, amojo_rights.", [n("page"), n("limit"), s("with")]],
  ["users", "get", "GET", "/api/v4/users/{id}", "Retrieve a user.", [s("with")]],
  ["users", "create", "POST", "/api/v4/users", `Add users. ${doc}`, [], W],
  ["users", "roles", "GET", "/api/v4/roles", "List user roles.", [n("page"), n("limit"), s("with")]],
  ["users", "role", "GET", "/api/v4/roles/{id}", "Retrieve a role.", []],
  ["users", "createRoles", "POST", "/api/v4/roles", `Add roles. ${doc}`, [], W],
  ["users", "updateRoles", "PATCH", "/api/v4/roles", `Edit roles. ${doc}`, [], W],
  ["users", "deleteRole", "DELETE", "/api/v4/roles/{id}", "Delete a role.", []],

  // Tasks
  ["tasks", "list", "GET", "/api/v4/tasks", "List tasks. filter supports id, responsible_user_id, entity_type, entity_id, is_completed, task_type, updated_at.", [n("page"), n("limit"), j("filter"), j("order")]],
  ["tasks", "get", "GET", "/api/v4/tasks/{id}", "Retrieve a task.", []],
  ["tasks", "create", "POST", "/api/v4/tasks", `Add tasks. Body is an array. ${doc}`, [], W],
  ["tasks", "update", "PATCH", "/api/v4/tasks", `Edit several tasks. Body is an array of objects each with an id. ${doc}`, [], W],
  ["tasks", "updateOne", "PATCH", "/api/v4/tasks/{id}", `Edit one task (set is_completed and result to complete it). ${doc}`, [], W],

  // Events
  ["events", "list", "GET", "/api/v4/events", "List events (activity log). filter supports type, entity, entity_id, created_by, created_at.", [n("page"), n("limit"), s("with"), j("filter")]],
  ["events", "get", "GET", "/api/v4/events/{id}", "Retrieve an event.", []],
  ["events", "types", "GET", "/api/v4/events/types", "List available event types.", [s("language_code")]],

  // Notes
  ["notes", "listForEntity", "GET", "/api/v4/{entity_type}/{entity_id}/notes", `List notes of one entity. ${entityTypeNote}`, [n("page"), n("limit"), j("filter"), j("order")]],
  ["notes", "list", "GET", "/api/v4/{entity_type}/notes", `List notes of all entities of a type. ${entityTypeNote}`, [n("page"), n("limit"), j("filter"), j("order")]],
  ["notes", "get", "GET", "/api/v4/{entity_type}/notes/{id}", `Retrieve a note. ${entityTypeNote}`, []],
  ["notes", "create", "POST", "/api/v4/{entity_type}/notes", `Add notes (array body). ${entityTypeNote} ${doc}`, [], W],
  ["notes", "createForEntity", "POST", "/api/v4/{entity_type}/{entity_id}/notes", `Add notes to one entity (array body). ${entityTypeNote} ${doc}`, [], W],
  ["notes", "update", "PATCH", "/api/v4/{entity_type}/notes", `Edit several notes. ${entityTypeNote} ${doc}`, [], W],
  ["notes", "updateOne", "PATCH", "/api/v4/{entity_type}/notes/{id}", `Edit one note. ${entityTypeNote} ${doc}`, [], W],
  ["notes", "pin", "POST", "/api/v4/{entity_type}/notes/{id}/pin", `Pin a note. ${entityTypeNote}`, []],
  ["notes", "unpin", "POST", "/api/v4/{entity_type}/notes/{id}/unpin", `Unpin a note. ${entityTypeNote}`, []],

  // Tags
  ["tags", "list", "GET", "/api/v4/{entity_type}/tags", `List tags of an entity type. ${entityTypeNote}`, [n("page"), n("limit"), j("filter")]],
  ["tags", "create", "POST", "/api/v4/{entity_type}/tags", `Create tags (array body). ${entityTypeNote} ${doc}`, [], W],

  // Links
  ["links", "list", "GET", "/api/v4/{entity_type}/{id}/links", `List entities linked to a lead, contact or company. ${entityTypeNote}`, [j("filter")]],
  ["links", "link", "POST", "/api/v4/{entity_type}/{id}/link", `Link entities to a lead, contact or company (array body). ${entityTypeNote} ${doc}`, [], W],
  ["links", "unlink", "POST", "/api/v4/{entity_type}/{id}/unlink", `Unlink entities from a lead, contact or company (array body). ${entityTypeNote} ${doc}`, [], W],

  // Salesbot
  ["salesbot", "list", "GET", "/api/v2/salesbot", "List Salesbots.", [n("page"), n("limit")]],
  ["salesbot", "get", "GET", "/api/v2/salesbot/{id}", "Retrieve a Salesbot.", []],
  ["salesbot", "launch", "POST", "/api/v2/salesbot/run", `Launch Salesbots on entities (array body). ${doc}`, [], W],
  ["salesbot", "stop", "POST", "/api/v2/salesbot/stop", `Stop a Salesbot for an entity. ${doc}`, [], W],

  // Sources
  ["sources", "list", "GET", "/api/v4/sources", "List integration sources of incoming leads.", [n("page"), n("limit")]],
  ["sources", "get", "GET", "/api/v4/sources/{id}", "Retrieve a source.", []],
  ["sources", "create", "POST", "/api/v4/sources", `Add sources. ${doc}`, [], W],
  ["sources", "update", "PATCH", "/api/v4/sources", `Edit several sources. ${doc}`, [], W],
  ["sources", "updateOne", "PATCH", "/api/v4/sources/{id}", `Edit one source. ${doc}`, [], W],
  ["sources", "delete", "DELETE", "/api/v4/sources/{id}", "Delete a source.", []],

  // Templates
  ["templates", "list", "GET", "/api/v4/chats/templates", "List chat response templates.", [n("page"), n("limit"), j("filter")]],
  ["templates", "get", "GET", "/api/v4/chats/templates/{id}", "Retrieve a template.", []],
  ["templates", "create", "POST", "/api/v4/chats/templates", `Add templates. ${doc}`, [], W],
  ["templates", "update", "PATCH", "/api/v4/chats/templates", `Edit templates. ${doc}`, [], W],
  ["templates", "delete", "DELETE", "/api/v4/chats/templates/{id}", "Delete a template.", []],

  // Webhooks
  ["webhooks", "list", "GET", "/api/v4/webhooks", "List webhook subscriptions.", [j("filter")]],
  ["webhooks", "subscribe", "POST", "/api/v4/webhooks", `Subscribe a webhook (body: destination, settings). ${doc}`, [], W],
  ["webhooks", "unsubscribe", "DELETE", "/api/v4/webhooks", `Unsubscribe a webhook (body: {destination}). ${doc}`, [], W],

  // Widgets
  ["widgets", "list", "GET", "/api/v4/widgets", "List widgets installed in the account.", [n("page"), n("limit")]],
  ["widgets", "get", "GET", "/api/v4/widgets/{code}", "Retrieve a widget by code.", []],

  // Customers
  ["customers", "list", "GET", "/api/v4/customers", "List customers. with can include segments, contacts, companies.", list],
  ["customers", "get", "GET", "/api/v4/customers/{id}", "Retrieve a customer.", [s("with")]],
  ["customers", "create", "POST", "/api/v4/customers", `Add customers. ${doc}`, [], W],
  ["customers", "update", "PATCH", "/api/v4/customers", `Edit customers. ${doc}`, [], W],
  ["customers", "statuses", "GET", "/api/v4/customers/statuses", "List customer statuses.", []],
  ["customers", "segments", "GET", "/api/v4/customers/segments", "List customer segments.", [n("page"), n("limit")]],

  // Calls
  ["calls", "create", "POST", "/api/v4/calls", `Add calls to the call log (array body). ${doc}`, [], W],
];

function fieldsOf(path: string, extra: Field[], hasBody: boolean | undefined): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "string", true, "path"]);
  const body: Field[] = hasBody ? [["body", "json", true, "query"]] : [];
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

// Kommo takes nested filters as PHP-style brackets: filter[statuses][0][pipeline_id]=1.
function flatten(prefix: string, value: unknown, out: URLSearchParams): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(`${prefix}[${index}]`, item, out));
  } else if (typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) flatten(`${prefix}[${key}]`, inner, out);
  } else {
    out.append(prefix, String(value));
  }
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const origin = originOf(account);
  const call = async (
    method: string,
    path: string,
    fields: Field[],
    hasBody: boolean | undefined,
    input: Record<string, unknown>,
  ) => {
    let target = path;
    const search = new URLSearchParams();
    for (const [name, type, , where] of fields) {
      const value = input[name];
      if (name === "body" || value === undefined || value === null) continue;
      if (where === "path") target = target.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (type === "json") flatten(name, value, search);
      else search.set(name, String(value));
    }
    const sendBody = hasBody && input.body !== undefined;
    const response = await fetcher(`${origin}${target}${search.size > 0 ? `?${search.toString()}` : ""}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        Accept: "application/json",
        ...(sendBody ? { "content-type": "application/json" } : {}),
      },
      body: sendBody ? JSON.stringify(input.body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Kommo answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra, hasBody] of rows) {
    const fields = fieldsOf(path, extra, hasBody);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, hasBody, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { kommo: kommo.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kommo ?? [],
        (account) =>
          withApprovals(build(account as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Kommo",
        description:
          "Kommo CRM: leads, contacts, companies, pipelines and stages, tasks, notes, tags, custom fields, catalogs, customers, users, sources, templates, webhooks and Salesbots.",
        instructions:
          "Writes take `body` exactly as Kommo documents: an array of entity objects for batch endpoints, a single object for single-entity PATCH. List filters are objects (for example filter {statuses: [{pipeline_id: 1, status_id: 2}]}); they are sent as Kommo's bracketed query parameters. Lists return up to 250 items per page (limit) with _links.next for paging.",
        icons,
      },
    ),
  }),
);
