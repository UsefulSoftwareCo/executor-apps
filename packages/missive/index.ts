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
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://public.missiveapp.com/v1";

const missive = defineProvider({
  name: "Missive",
  hosts: ["public.missiveapp.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/organizations?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ organizations: array(object({ id: string() })) }));
  },
});

type Account = { fields: { token: string } };
type Fetch = typeof globalThis.fetch;
type Params = Record<string, string | number | boolean | undefined>;

const search = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const missiveTools = (account: Account, signal: AbortSignal) => {
  const headers = { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" };
  const get = async (fetch: Fetch, path: string, params: Params = {}) =>
    decodeJson(await fetch(`${base}${path}${search(params)}`, { signal, headers }), json());
  const send = async (fetch: Fetch, method: string, path: string, body?: unknown) => {
    const response = await fetch(`${base}${path}`, {
      method,
      signal,
      headers: { ...headers, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // Successful writes may answer 201 or 204 with no body.
    if (response.ok && (response.status === 204 || response.headers.get("content-length") === "0")) {
      return { ok: true, status: response.status };
    }
    return decodeJson(response, json());
  };
  const ids = (list: string) => list.split(",").map((id) => id.trim()).filter((id) => id !== "").join(",");

  const page = { limit: number().optional(), offset: number().optional() };
  const cursor = { limit: number().optional(), until: number().optional() };

  return router({
    organizations: router(
      {
        list: query(
          { description: "List the organizations the token owner belongs to. Organization ids are needed by most write tools.", input: object(page) },
          async ({ fetch }, input) => get(fetch, "/organizations", input),
        ),
      },
      { title: "Organizations", description: "Organizations the API token owner belongs to." },
    ),
    users: router(
      {
        list: query(
          { description: "List users in the token owner's organizations (the owner has me: true). limit max 200.", input: object({ organization: string().optional(), ...page }) },
          async ({ fetch }, input) => get(fetch, "/users", input),
        ),
      },
      { title: "Users", description: "Users in your organizations." },
    ),
    teams: router(
      {
        list: query(
          { description: "List teams in organizations the token owner can access. limit max 200.", input: object({ organization: string().optional(), ...page }) },
          async ({ fetch }, input) => get(fetch, "/teams", input),
        ),
        create: mutation(
          {
            description:
              "Create teams (token must belong to an organization admin or owner). teams is an array of { name, organization, active_members?: string[] user ids, emoji? }.",
            input: object({ teams: array(json()) }),
            approval: always(),
          },
          async ({ fetch }, { teams }) => send(fetch, "POST", "/teams", { teams }),
        ),
        update: mutation(
          {
            description:
              "Update teams (admin or owner token). ids is a comma-separated list of team ids; teams is an array with one object per id, each with id and any of name, emoji, active_members.",
            input: object({ ids: string(), teams: array(json()) }),
            approval: always(),
          },
          async ({ fetch }, { ids: list, teams }) => send(fetch, "PATCH", `/teams/${ids(list)}`, { teams }),
        ),
      },
      { title: "Teams", description: "Teams within organizations." },
    ),
    conversations: router(
      {
        list: query(
          {
            description:
              "List conversations. At least one mailbox filter is required: set one of inbox, all, assigned, closed, snoozed, flagged, trashed, junked, drafts to true, or pass shared_label, team_inbox, team_closed or team_all as an id. Optional organization, and one of email, domain or contact_organization. limit max 50. Paginate with until set to the oldest last_activity_at of the previous page.",
            input: object({
              inbox: boolean().optional(),
              all: boolean().optional(),
              assigned: boolean().optional(),
              closed: boolean().optional(),
              snoozed: boolean().optional(),
              flagged: boolean().optional(),
              trashed: boolean().optional(),
              junked: boolean().optional(),
              drafts: boolean().optional(),
              shared_label: string().optional(),
              team_inbox: string().optional(),
              team_closed: string().optional(),
              team_all: string().optional(),
              organization: string().optional(),
              email: string().optional(),
              domain: string().optional(),
              contact_organization: string().optional(),
              ...cursor,
            }),
          },
          async ({ fetch }, input) => get(fetch, "/conversations", input),
        ),
        get: query(
          { description: "Get one conversation by id. If conversations were merged, the returned id may differ.", input: object({ id: string() }) },
          async ({ fetch }, { id }) => get(fetch, `/conversations/${encodeURIComponent(id)}`),
        ),
        messages: query(
          { description: "List messages in a conversation (no drafts), newest first, max 10 per call. Paginate with until set to the oldest delivered_at.", input: object({ id: string(), ...cursor }) },
          async ({ fetch }, { id, ...rest }) => get(fetch, `/conversations/${encodeURIComponent(id)}/messages`, rest),
        ),
        comments: query(
          { description: "List internal comments in a conversation, max 10 per call. Paginate with until set to the oldest created_at.", input: object({ id: string(), ...cursor }) },
          async ({ fetch }, { id, ...rest }) => get(fetch, `/conversations/${encodeURIComponent(id)}/comments`, rest),
        ),
        drafts: query(
          { description: "List drafts in a conversation, max 10 per call. Paginate with until set to the oldest delivered_at.", input: object({ id: string(), ...cursor }) },
          async ({ fetch }, { id, ...rest }) => get(fetch, `/conversations/${encodeURIComponent(id)}/drafts`, rest),
        ),
        posts: query(
          { description: "List posts in a conversation, max 10 per call. Paginate with until set to the oldest created_at.", input: object({ id: string(), ...cursor }) },
          async ({ fetch }, { id, ...rest }) => get(fetch, `/conversations/${encodeURIComponent(id)}/posts`, rest),
        ),
        update: mutation(
          {
            description:
              "Update conversations. ids is a comma-separated list of conversation ids; conversations is an array with one object per id, each { id, ... } with any of subject, conversation_color (hex or good/warning/danger), organization, team, force_team, add_to_inbox, add_to_team_inbox, close, reopen, add_users, add_assignees, remove_assignees, add_shared_labels, remove_shared_labels. organization is required with add_users, add_assignees, remove_assignees and add_shared_labels; team with add_to_team_inbox.",
            input: object({ ids: string(), conversations: array(json()) }),
            approval: always(),
          },
          async ({ fetch }, { ids: list, conversations }) => send(fetch, "PATCH", `/conversations/${ids(list)}`, { conversations }),
        ),
        merge: mutation(
          { description: "Merge conversation id into the conversation target. Optionally set the merged subject.", input: object({ id: string(), target: string(), subject: string().optional() }), approval: always() },
          async ({ fetch }, { id, ...body }) => send(fetch, "POST", `/conversations/${encodeURIComponent(id)}/merge`, body),
        ),
      },
      { title: "Conversations", description: "Shared inbox conversations and their messages, comments, drafts and posts." },
    ),
    messages: router(
      {
        get: query(
          { description: "Get one message with headers, body and attachments by message id.", input: object({ id: string() }) },
          async ({ fetch }, { id }) => get(fetch, `/messages/${encodeURIComponent(id)}`),
        ),
        findByEmailMessageId: query(
          { description: "Find messages by an email Message-ID header value (returns up to the latest 10).", input: object({ email_message_id: string() }) },
          async ({ fetch }, input) => get(fetch, "/messages", input),
        ),
        createIncoming: mutation(
          {
            description:
              "Create an incoming message in a custom channel (simulates a message received from an external system; it does not send email, use drafts.create with send true for that). message is the object { account (custom channel account id), from_field, to_fields?, body?, subject?, delivered_at?, attachments?, external_id?, references?, conversation?, team?, organization?, add_shared_labels?, ... }.",
            input: object({ message: json() }),
            approval: always(),
          },
          async ({ fetch }, { message }) => send(fetch, "POST", "/messages", { messages: message }),
        ),
      },
      { title: "Messages", description: "Read messages and create incoming messages in custom channels." },
    ),
    drafts: router(
      {
        create: mutation(
          {
            description:
              "Create a draft, or send a message by setting send true (send_at schedules it as a Unix time; auto_followup needs send_at). draft is the object with any of subject, body (HTML or text), from_field ({address,name} for email), to_fields, cc_fields, bcc_fields (arrays of {address,name}), attachments ([{base64_data, filename}]), conversation (reply into this conversation id) or references, account, team, organization, add_assignees, add_shared_labels, close, quote_previous_message, add_default_signature. Sending delivers real email or messages.",
            input: object({ draft: json() }),
            approval: always(),
          },
          async ({ fetch }, { draft }) => send(fetch, "POST", "/drafts", { drafts: draft }),
        ),
        delete: mutation(
          { description: "Delete a draft by id (returned when it was created).", input: object({ id: string() }), approval: always() },
          async ({ fetch }, { id }) => send(fetch, "DELETE", `/drafts/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Drafts", description: "Create, schedule and send drafts." },
    ),
    posts: router(
      {
        create: mutation(
          {
            description:
              "Create a post (an automated note) in a conversation. post is the object { notification: {title, body} (required), and one of text, markdown (max 8000 chars) or attachments ([{text, color, author_name, ...}]); optional conversation id or references, username, username_icon, conversation_subject, conversation_color, organization, team, add_assignees, add_shared_labels, add_to_inbox, close, reopen }.",
            input: object({ post: json() }),
            approval: always(),
          },
          async ({ fetch }, { post }) => send(fetch, "POST", "/posts", { posts: post }),
        ),
        delete: mutation(
          { description: "Delete a post by id. For shared conversations the token must belong to an organization admin or owner.", input: object({ id: string() }), approval: always() },
          async ({ fetch }, { id }) => send(fetch, "DELETE", `/posts/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Posts", description: "Automated posts inside conversations." },
    ),
    contacts: router(
      {
        list: query(
          {
            description:
              "List contacts in a contact book. limit max 200. order is last_name or last_modified. modified_since is Unix time; search is free text.",
            input: object({
              contact_book: string(),
              order: string().optional(),
              modified_since: number().optional(),
              include_deleted: boolean().optional(),
              search: string().optional(),
              ...page,
            }),
          },
          async ({ fetch }, input) => get(fetch, "/contacts", input),
        ),
        get: query(
          { description: "Get one contact by id (404 if deleted).", input: object({ id: string() }) },
          async ({ fetch }, { id }) => get(fetch, `/contacts/${encodeURIComponent(id)}`),
        ),
        create: mutation(
          {
            description:
              "Create contacts. contacts is an array of { contact_book (required), first_name, last_name, middle_name, nickname, notes, starred, infos: [{kind: email|phone_number|twitter|facebook|physical_address|url|custom, label, value, ...}], memberships: [{group: {kind: organization|group, name}, title, department, ...}] }.",
            input: object({ contacts: array(json()) }),
            approval: always(),
          },
          async ({ fetch }, { contacts }) => send(fetch, "POST", "/contacts", { contacts }),
        ),
        update: mutation(
          {
            description:
              "Update contacts. ids is a comma-separated list of contact ids; contacts has one object per id, each with id and the fields to change. If you send infos or memberships you must send the complete array, because omitted items are deleted.",
            input: object({ ids: string(), contacts: array(json()) }),
            approval: always(),
          },
          async ({ fetch }, { ids: list, contacts }) => send(fetch, "PATCH", `/contacts/${ids(list)}`, { contacts }),
        ),
        books: query(
          { description: "List contact books. limit max 200.", input: object(page) },
          async ({ fetch }, input) => get(fetch, "/contact_books", input),
        ),
        groups: query(
          { description: "List contact groups or organizations (kind) in a contact book. limit max 200.", input: object({ contact_book: string(), kind: string(), ...page }) },
          async ({ fetch }, input) => get(fetch, "/contact_groups", input),
        ),
      },
      { title: "Contacts", description: "Contacts, contact books and groups." },
    ),
    tasks: router(
      {
        list: query(
          {
            description:
              "List tasks, most recent activity first. state is todo, in_progress or closed; type is task, conversation or all. limit 2-50. Paginate with until set to the last task's last_activity_at minus 1. due_at_gteq and due_at_lteq are Unix times.",
            input: object({
              organization: string().optional(),
              team: string().optional(),
              assignee: string().optional(),
              state: string().optional(),
              type: string().optional(),
              conversation: string().optional(),
              due_at_gteq: number().optional(),
              due_at_lteq: number().optional(),
              ...cursor,
            }),
          },
          async ({ fetch }, input) => get(fetch, "/tasks", input),
        ),
        get: query(
          { description: "Get a task by id with assignees and team details.", input: object({ id: string() }) },
          async ({ fetch }, { id }) => get(fetch, `/tasks/${encodeURIComponent(id)}`),
        ),
        create: mutation(
          {
            description:
              "Create a task. task is { title (required), description?, state?, organization (required with team, assignees or add_users), team or assignees (one is required for standalone tasks), due_at?, subtask?, conversation? (required when subtask is true), references?, conversation_subject?, add_users?, add_to_inbox? }.",
            input: object({ task: json() }),
            approval: always(),
          },
          async ({ fetch }, { task }) => send(fetch, "POST", "/tasks", { tasks: task }),
        ),
        update: mutation(
          {
            description: "Update a task. changes may contain title, description, state (todo, in_progress, closed), assignees (user ids), team and due_at.",
            input: object({ id: string(), changes: json() }),
            approval: always(),
          },
          async ({ fetch }, { id, changes }) => send(fetch, "PATCH", `/tasks/${encodeURIComponent(id)}`, { tasks: changes }),
        ),
      },
      { title: "Tasks", description: "Standalone tasks and conversation subtasks." },
    ),
    sharedLabels: router(
      {
        list: query(
          { description: "List shared labels. limit max 200.", input: object({ organization: string().optional(), ...page }) },
          async ({ fetch }, input) => get(fetch, "/shared_labels", input),
        ),
        create: mutation(
          {
            description:
              "Create shared labels. shared_labels is an array of { name, organization (both required), color (hex), parent (label id), share_with_organization, share_with_team, share_with_users, visibility: organization|delegates }.",
            input: object({ shared_labels: array(json()) }),
            approval: always(),
          },
          async ({ fetch }, { shared_labels }) => send(fetch, "POST", "/shared_labels", { shared_labels }),
        ),
        update: mutation(
          {
            description: "Update shared labels. ids is a comma-separated list; shared_labels has one object per id with id and the fields to change.",
            input: object({ ids: string(), shared_labels: array(json()) }),
            approval: always(),
          },
          async ({ fetch }, { ids: list, shared_labels }) => send(fetch, "PATCH", `/shared_labels/${ids(list)}`, { shared_labels }),
        ),
      },
      { title: "Shared labels", description: "Organization shared labels." },
    ),
    responses: router(
      {
        list: query(
          { description: "List canned responses (templates) of the token owner. limit max 200.", input: object({ organization: string().optional(), ...page }) },
          async ({ fetch }, input) => get(fetch, "/responses", input),
        ),
        get: query(
          { description: "Get one response by id.", input: object({ id: string() }) },
          async ({ fetch }, { id }) => get(fetch, `/responses/${encodeURIComponent(id)}`),
        ),
        create: mutation(
          {
            description:
              "Create responses. responses is an array of { title, body (HTML), subject, organization or user (exactly one), share_with_team, shared_labels, to_fields, cc_fields, bcc_fields, external_id + external_source, attachments }.",
            input: object({ responses: array(json()) }),
            approval: always(),
          },
          async ({ fetch }, { responses }) => send(fetch, "POST", "/responses", { responses }),
        ),
        update: mutation(
          {
            description: "Update responses. ids is a comma-separated list; responses has one object per id with id and the fields to change. Pass all attachments to keep.",
            input: object({ ids: string(), responses: array(json()) }),
            approval: always(),
          },
          async ({ fetch }, { ids: list, responses }) => send(fetch, "PATCH", `/responses/${ids(list)}`, { responses }),
        ),
        delete: mutation(
          { description: "Delete responses. ids is a comma-separated list of response ids.", input: object({ ids: string() }), approval: always() },
          async ({ fetch }, { ids: list }) => send(fetch, "DELETE", `/responses/${ids(list)}`),
        ),
      },
      { title: "Responses", description: "Canned responses (reply templates)." },
    ),
    analytics: router(
      {
        createReport: mutation(
          {
            description:
              "Start an analytics report (Productive or Business plan). report is { organization, start, end (Unix times), time_zone?, teams?, users?, shared_labels?, accounts?, account_types? }. Returns reports.id; then call getReport about 5 seconds later.",
            input: object({ report: json() }),
            approval: always(),
          },
          async ({ fetch }, { report }) => send(fetch, "POST", "/analytics/reports", { reports: report }),
        ),
        getReport: query(
          { description: "Fetch an analytics report. It answers an empty 404 while incomplete, expired or missing; poll every 5 seconds. Reports expire 60 seconds after completion.", input: object({ id: string() }) },
          async ({ fetch }, { id }) => get(fetch, `/analytics/reports/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Analytics", description: "Team and user analytics reports." },
    ),
    webhooks: router(
      {
        create: mutation(
          {
            description:
              "Create a webhook subscription. hook is { type (incoming_email, incoming_sms_message, incoming_facebook_message, incoming_whatsapp_message, incoming_twilio_chat_message, new_comment, ...), url, organization? (omit for personal), content_contains?, content_starts_with?, content_ends_with?, and for new_comment is_task, author, mention; for incoming_email from_eq, subject_contains }.",
            input: object({ hook: json() }),
            approval: always(),
          },
          async ({ fetch }, { hook }) => send(fetch, "POST", "/hooks", { hooks: hook }),
        ),
        delete: mutation(
          { description: "Delete a webhook subscription by id.", input: object({ id: string() }), approval: always() },
          async ({ fetch }, { id }) => send(fetch, "DELETE", `/hooks/${encodeURIComponent(id)}`),
        ),
      },
      { title: "Webhooks", description: "Event webhook subscriptions." },
    ),
  });
};

export default defineApp({ user: { accounts: { missive: missive.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.missive ?? [], (account) => missiveTools(account, signal), { signal }), {
    title: "Missive",
    description:
      "Read and manage Missive conversations, drafts and sending, posts, contacts, tasks, teams, shared labels, canned responses, analytics and webhooks.",
    icons,
  }),
}));
