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

// Every SupportBee desk lives on its own host: https://<company>.supportbee.com.
const siteUrl = (company: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9]|[a-z0-9])(?:\.supportbee\.com)?\/?$/.exec(
    company.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <company> of <company>.supportbee.com (letters, digits, hyphens).");
  return `https://${match[1]}.supportbee.com`;
};

const supportbee = defineProvider({
  name: "SupportBee",
  hosts: ["*.supportbee.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({
        company: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("authorization", t`Bearer ${token}`),
    }),
  },
  // Any agent may list labels; the body always carries a `labels` array.
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.company)}/labels`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    await decodeJson(response, object({ labels: json() }));
  },
});

type Type = "string" | "number" | "boolean" | "json";
// where: path and query go on the URL; body fields are placed under `wrap` (or at the top level).
type Field = [name: string, type: Type, required: boolean, where: "path" | "query" | "body"];

const s = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "number", required, where];
const b = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "boolean", required, where];
const j = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "json", required, where];

const paging = [n("per_page", "query"), n("page", "query")];

type Row = {
  resource: string;
  action: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  fields?: Field[];
  /** Body fields are nested under this key, e.g. `ticket` for `{ ticket: { subject } }`. */
  wrap?: string;
  /** Names of body fields that belong under `content` (`{ content: { text, html } }`). */
  content?: string[];
  /** Path parameter names that are not numeric ids. */
  stringPath?: string[];
};

const contentFields = [s("text"), s("html"), j("attachment_ids")];

const rows: Row[] = [
  // Tickets
  {
    resource: "tickets", action: "list", method: "GET", path: "/tickets",
    description: "List tickets, 15 per page by default (per_page must be under 100), newest activity first. By default only non-archived tickets are returned. Dates (since, until) must be UTC.",
    fields: [
      ...paging, s("archived", "query"), b("spam", "query"), b("trash", "query"), b("replies", "query"),
      n("max_replies", "query"), s("assigned_user", "query"), s("assigned_team", "query"), s("label", "query"),
      s("since", "query"), s("until", "query"), s("requester_emails", "query"), s("sort_by", "query"),
      b("total_only", "query"),
    ],
  },
  {
    resource: "tickets", action: "search", method: "GET", path: "/tickets/search",
    description: "Search tickets with SupportBee's search syntax (free text plus operators such as from:, label:, assignee:).",
    fields: [s("query", "query", true), ...paging, b("spam", "query"), b("trash", "query")],
  },
  {
    resource: "tickets", action: "get", method: "GET", path: "/tickets/{id}",
    description: "Retrieve one ticket by id, including its content and replies.",
  },
  {
    resource: "tickets", action: "create", method: "POST", path: "/tickets", wrap: "ticket",
    description: "Create a ticket on behalf of a requester. subject defaults to No Subject; either text or html must be present. content is { text, html, attachment_ids }; pass text and/or html. Rate limit: 8 tickets per minute.",
    fields: [
      s("subject"), s("requester_name"), s("requester_email"),
      j("cc"), j("bcc"), b("notify_requester"), s("forwarding_address_id"), ...contentFields,
    ],
    content: ["text", "html", "attachment_ids"],
  },
  {
    resource: "tickets", action: "delete", method: "DELETE", path: "/tickets/{id}",
    description: "Permanently delete a ticket that is already in the trash.",
  },
  { resource: "tickets", action: "archive", method: "POST", path: "/tickets/{id}/archive", description: "Archive a ticket." },
  { resource: "tickets", action: "unarchive", method: "DELETE", path: "/tickets/{id}/archive", description: "Move an archived ticket back to the inbox." },
  { resource: "tickets", action: "markAnswered", method: "POST", path: "/tickets/{id}/answered", description: "Mark a ticket as answered." },
  { resource: "tickets", action: "markUnanswered", method: "DELETE", path: "/tickets/{id}/answered", description: "Mark a ticket as unanswered." },
  { resource: "tickets", action: "markSpam", method: "POST", path: "/tickets/{id}/spam", description: "Mark a ticket as spam." },
  { resource: "tickets", action: "unmarkSpam", method: "DELETE", path: "/tickets/{id}/spam", description: "Remove the spam mark from a ticket." },
  { resource: "tickets", action: "trash", method: "POST", path: "/tickets/{id}/trash", description: "Move a ticket to the trash." },
  { resource: "tickets", action: "untrash", method: "DELETE", path: "/tickets/{id}/trash", description: "Restore a ticket from the trash." },
  {
    resource: "tickets", action: "assignUser", method: "POST", path: "/tickets/{id}/user_assignment",
    wrap: "user_assignment", description: "Assign a ticket to an agent by user id.", fields: [n("user_id", "body", true)],
  },
  { resource: "tickets", action: "unassignUser", method: "DELETE", path: "/tickets/{id}/user_assignment", description: "Remove the agent assignment from a ticket." },
  {
    resource: "tickets", action: "assignTeam", method: "POST", path: "/tickets/{id}/team_assignment",
    wrap: "team_assignment",
    description: "Assign a ticket to a team. Reassigning to another team removes the assigned agent.",
    fields: [n("team_id", "body", true)],
  },
  { resource: "tickets", action: "unassignTeam", method: "DELETE", path: "/tickets/{id}/team_assignment", description: "Remove the team assignment from a ticket." },
  { resource: "tickets", action: "audit", method: "GET", path: "/tickets/{id}/audit", description: "Fetch the audit trail of a ticket." },
  // Labels on tickets
  {
    resource: "tickets", action: "addLabel", method: "POST", path: "/tickets/{ticket_id}/labels/{label_name}",
    description: "Add an existing label to a ticket (the label must already exist).", stringPath: ["label_name"],
  },
  {
    resource: "tickets", action: "removeLabel", method: "DELETE", path: "/tickets/{ticket_id}/labels/{label_name}",
    description: "Remove a label from a ticket.", stringPath: ["label_name"],
  },
  // Replies
  { resource: "replies", action: "list", method: "GET", path: "/tickets/{id}/replies", description: "List the replies on a ticket." },
  {
    resource: "replies", action: "get", method: "GET", path: "/tickets/{ticket_id}/replies/{id}",
    description: "Retrieve one reply on a ticket.",
  },
  {
    resource: "replies", action: "create", method: "POST", path: "/tickets/{id}/replies", wrap: "reply",
    description: "Send a reply to the requester of a ticket. cc and bcc are arrays of email addresses. on_behalf_of ({ id, email }) is admin only.",
    fields: [j("cc"), j("bcc"), j("on_behalf_of"), ...contentFields],
    content: ["text", "html", "attachment_ids"],
  },
  // Comments (internal notes)
  { resource: "comments", action: "list", method: "GET", path: "/tickets/{id}/comments", description: "List the internal comments on a ticket." },
  {
    resource: "comments", action: "create", method: "POST", path: "/tickets/{id}/comments", wrap: "comment",
    description: "Add an internal comment (not sent to the requester) to a ticket. Pass text and/or html; attachments is an array of attachment objects in the shape of the Attachment schema in SupportBee's API reference (id, filename, content_type, url). The reference documents no request-side example, so this is unverified; attachment upload itself is not exposed by this app.",
    fields: [s("text"), s("html"), j("attachments")],
    content: ["text", "html", "attachments"],
  },
  // Drafts
  {
    resource: "drafts", action: "get", method: "GET", path: "/tickets/{id}/draft",
    description: "Fetch the reply draft of a ticket. When none exists a new one with quoted content is returned (quote defaults to true; time_zone is an IANA name).",
    fields: [b("quote", "query"), s("time_zone", "query")],
  },
  {
    resource: "drafts", action: "create", method: "POST", path: "/tickets/{id}/draft", wrap: "draft",
    description: "Create a reply draft on a ticket. cc and bcc are comma-separated strings.",
    fields: [s("cc"), s("bcc"), ...contentFields], content: ["text", "html", "attachment_ids"],
  },
  {
    resource: "drafts", action: "update", method: "PUT", path: "/tickets/{id}/draft", wrap: "draft",
    description: "Update the existing reply draft of a ticket (404 when none exists). cc and bcc are comma-separated strings.",
    fields: [s("cc"), s("bcc"), ...contentFields], content: ["text", "html", "attachment_ids"],
  },
  { resource: "drafts", action: "delete", method: "DELETE", path: "/tickets/{id}/draft", description: "Delete the reply draft of a ticket." },
  // Users and customer groups
  {
    resource: "users", action: "list", method: "GET", path: "/users",
    description: "List users or customer groups. with_roles is a comma-separated subset of admin, agent, collaborator, customer (default: the first three); type is user (default) or customer_group.",
    fields: [b("with_invited", "query"), s("with_roles", "query"), s("type", "query")],
  },
  {
    resource: "users", action: "get", method: "GET", path: "/users/{id}",
    description: "Retrieve a user or customer group, with up to max_tickets (default 5) of their tickets.",
    fields: [n("max_tickets", "query")],
  },
  {
    resource: "users", action: "create", method: "POST", path: "/users", wrap: "user",
    description: "Create a user (role is admin, agent, collaborator or customer) or a customer group (type customer_group). team_ids is an array of team ids.",
    fields: [s("email", "body", true), s("name"), s("role"), j("team_ids"), s("type")],
  },
  {
    resource: "users", action: "update", method: "PUT", path: "/users/{id}", wrap: "user",
    description: "Update a user or customer group. Fields not provided are left unchanged.",
    fields: [s("email"), s("name"), s("role"), j("team_ids"), s("type")],
  },
  { resource: "users", action: "listMembers", method: "GET", path: "/users/{id}/members", description: "List the members of a customer group." },
  {
    resource: "users", action: "addMember", method: "POST", path: "/users/{id}/members", wrap: "member",
    description: "Add a user (by id) to a customer group.", fields: [n("member_id", "body", true)],
  },
  // Teams and labels
  {
    resource: "teams", action: "list", method: "GET", path: "/teams",
    description: "List teams. with_users includes the members; user=me limits the result to the current user's teams.",
    fields: [b("with_users", "query"), s("user", "query")],
  },
  { resource: "labels", action: "list", method: "GET", path: "/labels", description: "List all labels with their colors." },
  // Attachments are multipart; only JSON endpoints are exposed, so they are listed as a gap in the README.
  // Snippets
  { resource: "snippets", action: "list", method: "GET", path: "/snippets", description: "List all snippets (canned replies)." },
  {
    resource: "snippets", action: "create", method: "POST", path: "/snippets", wrap: "snippet",
    description: "Create a snippet. tags is a comma-separated string.", fields: [s("name", "body", true), s("tags"), s("text"), s("html")],
    content: ["text", "html"],
  },
  {
    resource: "snippets", action: "update", method: "PUT", path: "/snippets/{id}", wrap: "snippet",
    description: "Update a snippet.", fields: [s("name"), s("tags"), s("text"), s("html")], content: ["text", "html"],
  },
  { resource: "snippets", action: "delete", method: "DELETE", path: "/snippets/{id}", description: "Delete a snippet." },
  // Forwarding addresses
  { resource: "emails", action: "list", method: "GET", path: "/emails", description: "List the desk's forwarding addresses." },
  {
    resource: "emails", action: "create", method: "POST", path: "/emails", wrap: "forwarding_address",
    description: "Create a forwarding address.",
    fields: [s("name", "body", true), s("email", "body", true), b("filter_spam"), b("use_agent_name")],
  },
  // Filters: a filter links a rule to a consequence
  {
    resource: "filters", action: "createRule", method: "POST", path: "/rules", wrap: "rule",
    description: "Create a filter rule (the match condition). Returns the rule id to pass to filters.create.",
    fields: [s("requester_email"), s("delivered_to"), s("subject"), s("body")],
  },
  {
    resource: "filters", action: "createConsequence", method: "POST", path: "/consequences", wrap: "consequence",
    description: "Create a filter consequence (the action to take). Returns the consequence id to pass to filters.create.",
    fields: [b("archive"), b("spam"), b("trash"), s("label"), s("assign_user"), s("assign_team")],
  },
  {
    resource: "filters", action: "create", method: "POST", path: "/filters",
    description: "Create a filter linking a rule to a consequence.", fields: [s("rule_id", "body", true), s("consequence_id", "body", true)],
  },
  // Reports (admin only)
  ...(["avg_first_response_time", "tickets_count", "replies_count"] as const).map(
    (report): Row => ({
      resource: "reports", action: report, method: "GET", path: `/reports/${report}`,
      description: `Admin only. ${report === "avg_first_response_time" ? "Average first response time" : report === "tickets_count" ? "Ticket count" : "Reply count"} as data points over time, optionally limited to a user id, team id or label. since is a UTC date or datetime.`,
      fields: [n("user", "query"), n("team", "query"), s("label", "query"), s("since", "query")],
    }),
  ),
];

function fieldsOf(row: Row): Field[] {
  const pathFields: Field[] = [...row.path.matchAll(/\{(\w+)\}/g)].map((m) => [
    m[1]!,
    row.stringPath?.includes(m[1]!) ? "string" : "number",
    true,
    "path",
  ]);
  return [...pathFields, ...(row.fields ?? [])];
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
  fields: { company: string };
  url: (url: string) => string;
  headers: () => Record<string, string>;
};

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = siteUrl(account.fields.company);

  const call = async (row: Row, fields: Field[], input: Record<string, unknown>) => {
    let url = row.path;
    const search = new URLSearchParams();
    const body: Record<string, unknown> = {};
    const content: Record<string, unknown> = {};
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "path") url = url.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "query") search.set(name, String(value));
      else if (row.content?.includes(name)) content[name] = value;
      else body[name === "member_id" ? "id" : name] = value;
    }
    if (Object.keys(content).length > 0) {
      // Comments carry attachments inside content; every other body uses attachment_ids.
      body.content = content;
    }
    const payload = row.wrap === undefined ? body : { [row.wrap]: body };
    const hasBody = row.method !== "GET" && row.method !== "DELETE" && Object.keys(body).length > 0;
    const queryString = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(account.url(`${base}${url}${queryString}`), {
      method: row.method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(payload) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`SupportBee answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const fields = fieldsOf(row);
    const options = { description: describe(row.description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(row, fields, input);
    const tool = row.method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(row.resource) ?? {};
    group[row.action] = tool;
    groups.set(row.resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { supportbee: supportbee.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.supportbee ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SupportBee",
        description:
          "SupportBee shared inbox: tickets, replies, internal comments, drafts, assignment to agents and teams, labels, users and customer groups, snippets, forwarding addresses, filters and reports.",
        icons,
      },
    ),
  }),
);
