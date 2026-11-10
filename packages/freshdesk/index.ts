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

// Every Freshdesk account lives on its own host: https://<subdomain>.freshdesk.com.
const siteUrl = (subdomain: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9])(?:\.freshdesk\.com)?\/?$/.exec(
    subdomain.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <subdomain> of <subdomain>.freshdesk.com (letters, digits, hyphens).");
  return `https://${match[1]}.freshdesk.com`;
};

const Me = object({ id: number(), contact: object({ name: string(), email: string() }) });

const freshdesk = defineProvider({
  name: "Freshdesk",
  hosts: ["*.freshdesk.com"],
  auth: {
    // Freshdesk API v2 uses basic auth with the API key as username and any password ("X").
    // The Freshdesk API offers no user-created OAuth apps (Freshworks staff say OAuth is not planned).
    apiKey: secrets({
      label: "API key",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
      request: ({ apiKey }) => header("authorization", t`Basic ${base64(t`${apiKey}:X`)}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.subdomain)}/api/v2/agents/me`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return {
      accountInfo: {
        externalId: String(me.id),
        displayName: me.contact.name,
        email: me.contact.email,
      },
    };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Field = [name: string, type: Type, required: boolean, where: "path" | "query" | "body"];

const s = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "number", required, where];
const b = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "boolean", required, where];
const j = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "json", required, where];

const paging = [n("page", "query"), n("per_page", "query")];
const since = [s("updated_since", "query")];

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

// Path parameters ({braces}) are numeric ids, except those named in `stringPath`.
const stringPath = new Set<string>();

const ticketBody = [
  s("subject"), s("description"), n("status"), n("priority"), n("source"), s("type"), n("requester_id"), s("email"),
  s("name"), s("phone"), s("twitter_id"), n("unique_external_id"), n("responder_id"), n("group_id"), n("company_id"),
  n("product_id"), n("email_config_id"), s("due_by"), s("fr_due_by"), j("cc_emails"), j("tags"), j("custom_fields"),
];

const contactBody = [
  s("name"), s("email"), s("phone"), s("mobile"), s("twitter_id"), s("unique_external_id"), s("address"), s("description"),
  s("job_title"), s("language"), s("time_zone"), n("company_id"), b("view_all_tickets"), j("other_emails"),
  j("other_companies"), j("tags"), j("custom_fields"),
];

const companyBody = [
  s("name"), s("description"), s("note"), j("domains"), s("health_score"), s("account_tier"), s("renewal_date"),
  s("industry"), j("custom_fields"),
];

const rows: Row[] = [
  // Tickets
  ["tickets", "list", "GET", "/tickets", "List tickets (30 days by default; use updated_since for older). filter is one of new_and_my_open, watching, spam, deleted. include may be requester, company, stats, description. order_by is created_at, due_by, updated_at or status; order_type asc or desc.", [s("filter", "query"), n("requester_id", "query"), s("email", "query"), n("company_id", "query"), ...since, s("include", "query"), s("order_by", "query"), s("order_type", "query"), ...paging]],
  ["tickets", "get", "GET", "/tickets/{ticketId}", "Retrieve a ticket. include may be conversations, requester, company, stats.", [s("include", "query")]],
  ["tickets", "create", "POST", "/tickets", "Create a ticket. Requires one of requester_id, email, phone, twitter_id or unique_external_id, plus status (2 open, 3 pending, 4 resolved, 5 closed), priority (1 low to 4 urgent), and subject and description. source: 1 email, 2 portal, 3 phone, 7 chat, 9 feedback widget, 10 outbound email.", [...ticketBody]],
  ["tickets", "update", "PUT", "/tickets/{ticketId}", "Update a ticket's properties, including status, priority, assignee (responder_id), group, tags and custom fields.", [...ticketBody]],
  ["tickets", "delete", "DELETE", "/tickets/{ticketId}", "Move a ticket to the trash.", []],
  ["tickets", "restore", "PUT", "/tickets/{ticketId}/restore", "Restore a ticket from the trash.", []],
  ["tickets", "search", "GET", "/search/tickets", "Search tickets with a query in double quotes, for example \"status:2 AND priority:4\" or \"tag:'billing'\". Returns up to 30 per page, 10 pages.", [s("query", "query", true), n("page", "query")]],
  ["tickets", "bulkUpdate", "POST", "/tickets/bulk_update", "Update many tickets at once. ids is an array of ticket ids; properties holds the fields to set (priority, status, responder_id, group_id, ...); reply optionally adds a reply body.", [j("ids", "body", true), j("properties", "body", true), j("reply")]],
  ["tickets", "bulkDelete", "POST", "/tickets/bulk_delete", "Move many tickets to the trash. ids is an array of ticket ids.", [j("ids", "body", true)]],
  ["tickets", "merge", "POST", "/tickets/merge", "Merge secondary tickets into a primary ticket.", [n("primary_id", "body", true), j("ticket_ids", "body", true), j("convert_recepients_to_cc")]],
  ["tickets", "summary", "GET", "/tickets/{ticketId}/summary", "Get the agent-written summary of a ticket.", []],
  ["tickets", "listFields", "GET", "/ticket_fields", "List ticket fields, including custom fields and their choices. type filters by field type.", [s("type", "query")]],
  ["tickets", "listForms", "GET", "/ticket-forms", "List ticket forms.", []],

  // Conversations
  ["conversations", "list", "GET", "/tickets/{ticketId}/conversations", "List the replies and notes on a ticket.", [...paging]],
  ["conversations", "reply", "POST", "/tickets/{ticketId}/reply", "Send a public reply to the requester of a ticket. body is HTML.", [s("body", "body", true), s("from_email"), n("user_id"), j("cc_emails"), j("bcc_emails")]],
  ["conversations", "addNote", "POST", "/tickets/{ticketId}/notes", "Add a note to a ticket. private defaults to true; set false for a public note. notify_emails lists agents to notify.", [s("body", "body", true), b("private"), n("user_id"), j("notify_emails")]],
  ["conversations", "forward", "POST", "/tickets/{ticketId}/forward", "Forward a ticket conversation by email. to_emails is an array of addresses.", [s("body", "body", true), j("to_emails", "body", true), j("cc_emails"), j("bcc_emails"), s("from_email"), n("user_id")]],
  ["conversations", "update", "PUT", "/conversations/{conversationId}", "Edit a note's body.", [s("body", "body", true)]],
  ["conversations", "delete", "DELETE", "/conversations/{conversationId}", "Delete a reply or note.", []],

  // Time entries
  ["timeEntries", "list", "GET", "/time_entries", "List time entries. Filter by company_id, agent_id, executed_after, executed_before (ISO 8601), billable.", [n("company_id", "query"), n("agent_id", "query"), s("executed_after", "query"), s("executed_before", "query"), b("billable", "query"), ...paging]],
  ["timeEntries", "listForTicket", "GET", "/tickets/{ticketId}/time_entries", "List time entries on a ticket.", [...paging]],
  ["timeEntries", "create", "POST", "/tickets/{ticketId}/time_entries", "Add a time entry to a ticket. time_spent is hh:mm.", [b("billable"), s("time_spent"), s("note"), n("agent_id"), s("executed_at"), b("timer_running")]],
  ["timeEntries", "update", "PUT", "/time_entries/{timeEntryId}", "Update a time entry.", [b("billable"), s("time_spent"), s("note"), n("agent_id"), s("executed_at")]],
  ["timeEntries", "toggleTimer", "PUT", "/time_entries/{timeEntryId}/toggle_timer", "Start or stop a time entry's timer.", []],
  ["timeEntries", "delete", "DELETE", "/time_entries/{timeEntryId}", "Delete a time entry.", []],

  // Satisfaction ratings
  ["satisfactionRatings", "list", "GET", "/surveys/satisfaction_ratings", "List customer satisfaction ratings. created_since is an ISO 8601 timestamp.", [s("created_since", "query"), ...paging]],
  ["satisfactionRatings", "listForTicket", "GET", "/tickets/{ticketId}/satisfaction_ratings", "List satisfaction ratings for a ticket.", []],
  ["satisfactionRatings", "listSurveys", "GET", "/surveys", "List customer satisfaction surveys. state filters surveys, e.g. active.", [s("state", "query")]],

  // Contacts
  ["contacts", "list", "GET", "/contacts", "List contacts. Filter by email, mobile, phone, company_id, state (blocked, deleted, unverified, verified).", [s("email", "query"), s("mobile", "query"), s("phone", "query"), n("company_id", "query"), s("state", "query"), ...since, ...paging]],
  ["contacts", "get", "GET", "/contacts/{contactId}", "Retrieve a contact.", []],
  ["contacts", "create", "POST", "/contacts", "Create a contact. name is required, plus one of email, phone, mobile, twitter_id or unique_external_id.", [...contactBody]],
  ["contacts", "update", "PUT", "/contacts/{contactId}", "Update a contact.", [...contactBody]],
  ["contacts", "delete", "DELETE", "/contacts/{contactId}", "Soft-delete a contact.", []],
  ["contacts", "hardDelete", "DELETE", "/contacts/{contactId}/hard_delete", "Permanently delete a contact. force=true also deletes their tickets' association.", [b("force", "query")]],
  ["contacts", "restore", "PUT", "/contacts/{contactId}/restore", "Restore a soft-deleted contact.", []],
  ["contacts", "makeAgent", "PUT", "/contacts/{contactId}/make_agent", "Convert a contact into an agent.", [b("occasional"), j("ticket_scope"), j("group_ids"), j("role_ids")]],
  ["contacts", "sendInvite", "PUT", "/contacts/{contactId}/send_invite", "Send a portal invitation to a contact.", []],
  ["contacts", "search", "GET", "/search/contacts", "Search contacts by name prefix (term), or by field with query, for example \"email:'a@b.com'\".", [s("term", "query"), s("query", "query")]],
  ["contacts", "autocomplete", "GET", "/contacts/autocomplete", "Autocomplete contacts by name.", [s("term", "query", true)]],
  ["contacts", "listFields", "GET", "/contact_fields", "List contact fields, including custom fields.", []],

  // Companies
  ["companies", "list", "GET", "/companies", "List companies.", [...paging]],
  ["companies", "get", "GET", "/companies/{companyId}", "Retrieve a company.", []],
  ["companies", "create", "POST", "/companies", "Create a company. name is required.", [...companyBody]],
  ["companies", "update", "PUT", "/companies/{companyId}", "Update a company.", [...companyBody]],
  ["companies", "delete", "DELETE", "/companies/{companyId}", "Delete a company.", []],
  ["companies", "search", "GET", "/search/companies", "Search companies by field with query, for example \"name:'Acme'\".", [s("query", "query", true), n("page", "query")]],
  ["companies", "autocomplete", "GET", "/companies/autocomplete", "Autocomplete companies by name.", [s("name", "query", true)]],
  ["companies", "listFields", "GET", "/company_fields", "List company fields, including custom fields.", []],

  // Agents, groups, roles
  ["agents", "list", "GET", "/agents", "List agents. Filter by email, mobile, phone, state (fulltime, occasional).", [s("email", "query"), s("mobile", "query"), s("phone", "query"), s("state", "query"), ...paging]],
  ["agents", "me", "GET", "/agents/me", "The authenticated agent.", []],
  ["agents", "get", "GET", "/agents/{agentId}", "Retrieve an agent.", []],
  ["agents", "create", "POST", "/agents", "Create an agent. email is required.", [s("email", "body", true), b("occasional"), s("signature"), s("job_title"), s("language"), s("time_zone"), n("ticket_scope"), j("group_ids"), j("role_ids")]],
  ["agents", "update", "PUT", "/agents/{agentId}", "Update an agent.", [s("email"), b("occasional"), s("signature"), s("job_title"), s("language"), s("time_zone"), n("ticket_scope"), j("group_ids"), j("role_ids")]],
  ["agents", "delete", "DELETE", "/agents/{agentId}", "Delete an agent (converts them back to a contact).", []],
  ["agents", "autocomplete", "GET", "/agents/autocomplete", "Autocomplete agents by name.", [s("term", "query", true)]],
  ["groups", "list", "GET", "/groups", "List agent groups.", [...paging]],
  ["groups", "get", "GET", "/groups/{groupId}", "Retrieve a group.", []],
  ["groups", "create", "POST", "/groups", "Create a group. name is required; auto_ticket_assign is 0 or 1.", [s("name", "body", true), s("description"), n("escalate_to"), n("unassigned_for"), n("auto_ticket_assign"), j("agent_ids")]],
  ["groups", "update", "PUT", "/groups/{groupId}", "Update a group.", [s("name"), s("description"), n("escalate_to"), n("unassigned_for"), n("auto_ticket_assign"), j("agent_ids")]],
  ["groups", "delete", "DELETE", "/groups/{groupId}", "Delete a group.", []],
  ["roles", "list", "GET", "/roles", "List agent roles.", []],
  ["roles", "get", "GET", "/roles/{roleId}", "Retrieve a role.", []],

  // Canned responses
  ["cannedResponses", "listFolders", "GET", "/canned_response_folders", "List canned response folders.", []],
  ["cannedResponses", "getFolder", "GET", "/canned_response_folders/{folderId}", "Retrieve a canned response folder.", []],
  ["cannedResponses", "createFolder", "POST", "/canned_response_folders", "Create a canned response folder.", [s("name", "body", true)]],
  ["cannedResponses", "updateFolder", "PUT", "/canned_response_folders/{folderId}", "Rename a canned response folder.", [s("name", "body", true)]],
  ["cannedResponses", "listInFolder", "GET", "/canned_response_folders/{folderId}/responses", "List the canned responses in a folder.", []],
  ["cannedResponses", "get", "GET", "/canned_responses/{responseId}", "Retrieve a canned response.", []],
  ["cannedResponses", "create", "POST", "/canned_responses", "Create a canned response. visibility: 0 all agents, 1 personal, 2 select groups.", [s("title", "body", true), s("content_html", "body", true), n("folder_id", "body", true), n("visibility", "body", true), j("group_ids")]],
  ["cannedResponses", "update", "PUT", "/canned_responses/{responseId}", "Update a canned response.", [s("title"), s("content_html"), n("folder_id"), n("visibility"), j("group_ids")]],

  // Solutions (knowledge base)
  ["solutions", "listCategories", "GET", "/solutions/categories", "List knowledge base categories.", []],
  ["solutions", "getCategory", "GET", "/solutions/categories/{categoryId}", "Retrieve a category.", []],
  ["solutions", "createCategory", "POST", "/solutions/categories", "Create a category.", [s("name", "body", true), s("description"), j("visible_in_portals")]],
  ["solutions", "updateCategory", "PUT", "/solutions/categories/{categoryId}", "Update a category.", [s("name"), s("description"), j("visible_in_portals")]],
  ["solutions", "deleteCategory", "DELETE", "/solutions/categories/{categoryId}", "Delete a category.", []],
  ["solutions", "listFolders", "GET", "/solutions/categories/{categoryId}/folders", "List the folders in a category.", []],
  ["solutions", "getFolder", "GET", "/solutions/folders/{folderId}", "Retrieve a folder.", []],
  ["solutions", "createFolder", "POST", "/solutions/categories/{categoryId}/folders", "Create a folder. visibility: 1 all, 2 logged-in users, 3 agents, 4 select companies.", [s("name", "body", true), n("visibility", "body", true), s("description"), j("company_ids")]],
  ["solutions", "updateFolder", "PUT", "/solutions/folders/{folderId}", "Update a folder.", [s("name"), n("visibility"), s("description"), j("company_ids")]],
  ["solutions", "deleteFolder", "DELETE", "/solutions/folders/{folderId}", "Delete a folder.", []],
  ["solutions", "listArticles", "GET", "/solutions/folders/{folderId}/articles", "List the articles in a folder.", [...paging]],
  ["solutions", "getArticle", "GET", "/solutions/articles/{articleId}", "Retrieve an article.", []],
  ["solutions", "createArticle", "POST", "/solutions/folders/{folderId}/articles", "Create an article. status: 1 draft, 2 published; type: 1 permanent, 2 workaround.", [s("title", "body", true), s("description", "body", true), n("status", "body", true), n("type"), j("tags"), s("seo_data")]],
  ["solutions", "updateArticle", "PUT", "/solutions/articles/{articleId}", "Update an article.", [s("title"), s("description"), n("status"), n("type"), j("tags"), n("agent_id")]],
  ["solutions", "deleteArticle", "DELETE", "/solutions/articles/{articleId}", "Delete an article.", []],
  ["solutions", "search", "GET", "/search/solutions", "Search knowledge base articles by keyword.", [s("term", "query", true)]],

  // Discussions (forums)
  ["discussions", "listCategories", "GET", "/discussions/categories", "List forum categories.", []],
  ["discussions", "listForums", "GET", "/discussions/categories/{categoryId}/forums", "List the forums in a category.", []],
  ["discussions", "listTopics", "GET", "/discussions/forums/{forumId}/topics", "List the topics in a forum.", [...paging]],
  ["discussions", "getTopic", "GET", "/discussions/topics/{topicId}", "Retrieve a topic.", []],
  ["discussions", "listComments", "GET", "/discussions/topics/{topicId}/comments", "List the comments on a topic.", [...paging]],

  // Helpdesk configuration
  ["helpdesk", "settings", "GET", "/settings/helpdesk", "Helpdesk settings: primary language, supported languages, portal and feature flags.", []],
  ["helpdesk", "listProducts", "GET", "/products", "List products.", []],
  ["helpdesk", "getProduct", "GET", "/products/{productId}", "Retrieve a product.", []],
  ["helpdesk", "listEmailConfigs", "GET", "/email_configs", "List support mailboxes.", []],
  ["helpdesk", "getEmailConfig", "GET", "/email_configs/{configId}", "Retrieve a support mailbox.", []],
  ["helpdesk", "listBusinessHours", "GET", "/business_hours", "List business hours calendars.", [...paging]],
  ["helpdesk", "getBusinessHours", "GET", "/business_hours/{businessHoursId}", "Retrieve a business hours calendar.", []],
  ["helpdesk", "listSlaPolicies", "GET", "/sla_policies", "List SLA policies.", []],
  ["helpdesk", "updateSlaPolicy", "PUT", "/sla_policies/{policyId}", "Update an SLA policy (name, description, active, applicable_to, sla_target, escalation).", [s("name"), s("description"), b("active"), j("applicable_to"), j("sla_target"), j("escalation")]],
  ["helpdesk", "listAutomationRules", "GET", "/automations/{automationTypeId}/rules", "List automation rules. automationTypeId: 1 ticket creation, 3 time triggers, 4 ticket updates.", []],
  ["helpdesk", "listScenarioAutomations", "GET", "/scenario_automations", "List scenario automations.", []],
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
  fields: { subdomain: string };
  url: (url: string) => string;
  headers: () => Record<string, string>;
};

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = siteUrl(account.fields.subdomain);

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
    const queryString = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(account.url(`${base}/api/v2${url}${queryString}`), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Freshdesk answered ${response.status}: ${text.slice(0, 1000)}`);
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
  { user: { accounts: { freshdesk: freshdesk.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.freshdesk ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Freshdesk",
        description:
          "Freshdesk helpdesk: tickets, conversations, time entries, contacts, companies, agents, groups, canned responses, knowledge base, forums and helpdesk settings.",
        icons,
      },
    ),
  }),
);
