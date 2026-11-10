import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.callrail.com";

const callrail = defineProvider({
  name: "CallRail",
  hosts: ["api.callrail.com"],
  auth: {
    // CallRail OAuth is not offered to customers; API keys are the supported method.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v3/a.json`, {
      signal,
      headers: { Authorization: `Token token=${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(`${key}[]`, String(item));
      else url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Token token=${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };

  // Paths are scoped to an account. When the caller omits accountId, use the key's only account.
  let cached: string | undefined;
  const accountId = async (given: string | undefined): Promise<string> => {
    if (given !== undefined) return given;
    if (cached !== undefined) return cached;
    const list = (await call("GET", "/v3/a.json")) as { accounts?: { id?: string }[] };
    const ids = (list.accounts ?? []).map((a) => a.id).filter((id): id is string => typeof id === "string");
    if (ids.length !== 1) throw new Error(`Pass accountId: this key reaches ${ids.length} accounts (${ids.join(", ")}).`);
    cached = ids[0];
    return ids[0]!;
  };
  return { call, accountId };
}

type Client = ReturnType<typeof client>;

const accountInput = string().optional();
const filters = record(json()).optional();
const payload = record(json());
const optionalPayload = record(json()).optional();

// Every tool takes an optional accountId, path ids, `query` filters and (for writes) a JSON `body`.
// Paths use {account_id} and named ids.
function read(c: Client, path: string, description: string, ids: readonly string[] = []) {
  return query(
    {
      description,
      input: object({
        accountId: accountInput,
        ...Object.fromEntries(ids.map((id) => [id, string()])),
        query: filters,
      }),
    },
    async (_ctx, input: Params) => run(c, "GET", path, input, ids, false),
  );
}

function write(c: Client, method: Exclude<Method, "GET">, path: string, description: string, ids: readonly string[] = [], hasBody: boolean | "optional" = true) {
  return mutation(
    {
      description,
      input: object({
        accountId: accountInput,
        ...Object.fromEntries(ids.map((id) => [id, string()])),
        query: filters,
        ...(hasBody === "optional" ? { body: optionalPayload } : hasBody ? { body: payload } : {}),
      }),
    },
    async (_ctx, input: Params) => run(c, method, path, input, ids, hasBody),
  );
}

async function run(c: Client, method: Method, path: string, input: Params, ids: readonly string[], hasBody: boolean | "optional") {
  let resolved = path;
  if (path.includes("{account_id}")) resolved = path.replace("{account_id}", encodeURIComponent(await c.accountId(input.accountId as string | undefined)));
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  return c.call(method, resolved, (input.query as Params | undefined) ?? {}, hasBody ? (input.body as Params | undefined) : undefined);
}

function build(c: Client) {
  const a = "/v3/a/{account_id}";
  const page = "Offset pagination: query page (from 1) and per_page; the response has total_pages and total_records.";

  return router({
    accounts: router(
      {
        list: read(c, "/v3/a.json", `List accounts the API key can access. ${page}`),
        get: read(c, `${a}.json`, "Retrieve an account."),
      },
      { title: "Accounts", description: "CallRail accounts." },
    ),
    companies: router(
      {
        list: read(c, `${a}/companies.json`, `List companies. Query: status (active, disabled), search, sort, fields. ${page}`),
        get: read(c, `${a}/companies/{company_id}.json`, "Retrieve a company.", ["company_id"]),
        create: write(c, "POST", `${a}/companies.json`, "Create a company. body: name (required), time_zone."),
        update: write(c, "PUT", `${a}/companies/{company_id}.json`, "Update a company. body: name, time_zone, callscore_enabled, callscribe_enabled, swap_* settings, external_form_capture.", ["company_id"]),
        bulkUpdate: write(c, "POST", `${a}/companies/bulk_update.json`, "Update many companies. body: company_ids (or [\"all\"]) and external_form_capture."),
        disable: write(c, "DELETE", `${a}/companies/{company_id}.json`, "Disable a company.", ["company_id"], false),
      },
      { title: "Companies", description: "Companies within an account." },
    ),
    calls: router(
      {
        list: read(c, `${a}/calls.json`, "List calls. Query: company_id, tracker_id, date_range (recent, today, yesterday, last_7_days, last_30_days, this_month, last_month, this_year, last_year, all_time) or start_date and end_date, answer_status, direction, device, lead_status, tags, search, sort, order, fields, per_page, and relative_pagination with offset for large sets."),
        get: read(c, `${a}/calls/{call_id}.json`, "Retrieve a call. Query fields selects extras such as transcription, sentiment, milestones, keywords_spotted, tags and utm_* values.", ["call_id"]),
        recording: read(c, `${a}/calls/{call_id}/recording.json`, "Get the recording URL of a call.", ["call_id"]),
        pageViews: read(c, `${a}/calls/{call_id}/page_views.json`, "List the page views that preceded a call.", ["call_id"]),
        summary: read(c, `${a}/calls/summary.json`, "Aggregated call statistics. Query: group_by (source, keywords, campaign, referrer, landing_page, company), fields (total_calls, missed_calls, answered_calls, first_time_callers, average_duration, leads), plus the filters of the call list."),
        timeseries: read(c, `${a}/calls/timeseries.json`, "Call statistics over time. Query: interval (hour, day, week, month, year) plus the filters of the call summary."),
        create: write(c, "POST", `${a}/calls.json`, "Place an outbound call. body: caller_id, customer_phone_number, business_phone_number (required), recording_enabled, agent_id, outbound_greeting_text."),
        update: write(c, "PUT", `${a}/calls/{call_id}.json`, "Update a call. body: tags, append_tags, note, value, lead_status (good_lead, not_a_lead, null), customer_name, spam.", ["call_id"]),
      },
      { title: "Calls", description: "Tracked inbound and outbound calls." },
    ),
    textMessages: router(
      {
        list: read(c, `${a}/text-messages.json`, "List text conversations. Query: company_id, date_range, search, fields. " + page),
        get: read(c, `${a}/text-messages/{conversation_id}.json`, "Retrieve a text conversation with its messages.", ["conversation_id"]),
        send: write(c, "POST", `${a}/text-messages.json`, "Send a text message. body: company_id, customer_phone_number, content (required), tracking_number (required unless a conversation exists), media_url for MMS."),
      },
      { title: "Text messages", description: "Text conversations and sending." },
    ),
    smsThreads: router(
      {
        list: read(c, `${a}/sms-threads.json`, "List SMS threads. Query: company_id, date_range or start_date and end_date, search."),
        get: read(c, `${a}/sms-threads/{thread_id}.json`, "Retrieve an SMS thread. Query: page, per_page, with_msg_errors.", ["thread_id"]),
        update: write(c, "PUT", `${a}/sms-threads/{thread_id}.json`, "Update an SMS thread. body: notes, value, tags, append_tags, lead_qualification.", ["thread_id"]),
      },
      { title: "SMS threads", description: "Per-customer SMS threads." },
    ),
    formSubmissions: router(
      {
        list: read(c, `${a}/form_submissions.json`, "List form submissions. Query: company_id, date_range, lead_status, person_lead, tags, sort, fields (company_name, form_name, timeline_url, milestones, ...)."),
        create: write(c, "POST", `${a}/form_submissions.json`, "Record a form submission. body.form_submission: company_id, referrer, referring_url, landing_page_url, form_url, form_data (or session_id)."),
        update: write(c, "PUT", `${a}/form_submissions/{form_submission_id}.json`, "Update a form submission. body: tags, append_tags, note, value, lead_status.", ["form_submission_id"]),
        ignoredFields: write(c, "POST", `${a}/form_submissions/ignored_fields.json`, "Set fields ignored in form capture. body: company_ids, field_names."),
        summary: read(c, `${a}/forms/summary.json`, "Aggregated form statistics. Query: company_id, group_by, fields (total_forms, first_forms, leads), tags, lead_status, date filters."),
      },
      { title: "Form submissions", description: "Tracked form submissions." },
    ),
    trackers: router(
      {
        list: read(c, `${a}/trackers.json`, "List trackers. Query: company_id, type (session, source), status (active, disabled), search, fields (campaign_name, swap_targets). " + page),
        get: read(c, `${a}/trackers/{tracker_id}.json`, "Retrieve a tracker.", ["tracker_id"]),
        create: write(c, "POST", `${a}/trackers.json`, "Create a session or source tracker. body: name, type, company_id, call_flow, source and either pool_size with pool_numbers (session) or tracking_number (source)."),
        update: write(c, "PUT", `${a}/trackers/{tracker_id}.json`, "Update a tracker. body: name, call_flow, message_flow, source, sms_enabled, swap_targets, whisper_message, replace_tracking_number.", ["tracker_id"]),
        disable: write(c, "DELETE", `${a}/trackers/{tracker_id}.json`, "Disable a tracker.", ["tracker_id"], false),
      },
      { title: "Trackers", description: "Tracking numbers and number pools." },
    ),
    messageFlows: router(
      {
        list: read(c, `${a}/message-flows.json`, "List message flows. Query: company_id."),
        get: read(c, `${a}/message-flows/{message_flow_id}.json`, "Retrieve a message flow.", ["message_flow_id"]),
        create: write(c, "POST", `${a}/message-flows.json`, "Create a message flow. body: company_id, name, initial_step_id, steps."),
        update: write(c, "PUT", `${a}/message-flows/{message_flow_id}.json`, "Update a message flow. body: name, initial_step_id, steps.", ["message_flow_id"]),
        delete: write(c, "DELETE", `${a}/message-flows/{message_flow_id}.json`, "Delete a message flow not assigned to a tracker.", ["message_flow_id"], false),
      },
      { title: "Message flows", description: "Automated text message flows." },
    ),
    tags: router(
      {
        list: read(c, `${a}/tags.json`, "List tags. Query: company_id, status (enabled, disabled), tag_level (company, account), sort."),
        create: write(c, "POST", `${a}/tags.json`, "Create a tag. body: name, company_id (for company tags), color, tag_level."),
        update: write(c, "PUT", `${a}/tags/{tag_id}.json`, "Update a tag. body: name, color, disabled.", ["tag_id"]),
        delete: write(c, "DELETE", `${a}/tags/{tag_id}.json`, "Delete a tag.", ["tag_id"], false),
      },
      { title: "Tags", description: "Tags for calls, texts and forms." },
    ),
    users: router(
      {
        list: read(c, `${a}/users.json`, "List users. Query: company_id, search, sort (email, created_at). " + page),
        get: read(c, `${a}/users/{user_id}.json`, "Retrieve a user.", ["user_id"]),
        create: write(c, "POST", `${a}/users.json`, "Create a user (admin keys only). body: first_name, last_name, email, role (admin, reporting, manager), companies."),
        update: write(c, "PUT", `${a}/users/{user_id}.json`, "Update a user. body: first_name, last_name, email, current_password, companies.", ["user_id"]),
        delete: write(c, "DELETE", `${a}/users/{user_id}.json`, "Delete a user (admin keys only).", ["user_id"], false),
      },
      { title: "Users", description: "Account users." },
    ),
    callerIds: router(
      {
        list: read(c, `${a}/caller_ids.json`, "List verified outbound caller IDs. Query: company_id (required)."),
        get: read(c, `${a}/caller_ids/{caller_id}.json`, "Retrieve an outbound caller ID.", ["caller_id"]),
        create: write(c, "POST", `${a}/caller_ids.json`, "Add an outbound caller ID, which triggers a verification call. body: company_id, phone_number, name."),
        delete: write(c, "DELETE", `${a}/caller_ids/{caller_id}.json`, "Remove an outbound caller ID.", ["caller_id"], false),
      },
      { title: "Caller IDs", description: "Outbound caller IDs." },
    ),
    integrations: router(
      {
        list: read(c, `${a}/integrations.json`, "List integrations. Query: company_id (required), fields (signing_key)."),
        get: read(c, `${a}/integrations/{integration_id}.json`, "Retrieve an integration.", ["integration_id"]),
        create: write(c, "POST", `${a}/integrations.json`, "Create a Webhooks or Custom integration. body: company_id, type, config (for example post_call_webhook, sms_received_webhook, form_captured_webhook)."),
        update: write(c, "PUT", `${a}/integrations/{integration_id}.json`, "Update an integration. body: state (active, disabled), config.", ["integration_id"]),
        disable: write(c, "DELETE", `${a}/integrations/{integration_id}.json`, "Disable an integration.", ["integration_id"], false),
        filters: read(c, `${a}/integration_triggers.json`, "List integration filters (criteria). Query: company_id (required)."),
        getFilter: read(c, `${a}/integration_triggers/{integration_trigger_id}.json`, "Retrieve an integration filter.", ["integration_trigger_id"]),
        createFilter: write(c, "POST", `${a}/integration_triggers.json`, "Create an integration filter. body: company_id, integration_id, tracker_ids, call_type, min_duration, max_duration, lead_status."),
        updateFilter: write(c, "PUT", `${a}/integration_triggers/{integration_trigger_id}.json`, "Update an integration filter.", ["integration_trigger_id"]),
        deleteFilter: write(c, "DELETE", `${a}/integration_triggers/{integration_trigger_id}.json`, "Delete an integration filter.", ["integration_trigger_id"], false),
      },
      { title: "Integrations", description: "Webhook integrations and their filters." },
    ),
    notifications: router(
      {
        list: read(c, `${a}/notifications.json`, "List notification settings. Query: notification_type (send_desktop, send_email, send_push), user_id, email."),
        create: write(c, "POST", `${a}/notifications.json`, "Create a notification. body: user_id or email, company_id, tracker_id, agent_id, call_enabled, sms_enabled, alert_type, send_desktop, send_email, send_push."),
        update: write(c, "PUT", `${a}/notifications/{notification_id}.json`, "Update a notification.", ["notification_id"]),
        delete: write(c, "DELETE", `${a}/notifications/{notification_id}.json`, "Delete a notification.", ["notification_id"], false),
      },
      { title: "Notifications", description: "Alert notification settings." },
    ),
    summaryEmails: router(
      {
        list: read(c, `${a}/summary_emails`, "List summary emails. Query: frequency, company_id, user_id, email."),
        get: read(c, `${a}/summary_emails/{summary_email_id}.json`, "Retrieve a summary email.", ["summary_email_id"]),
        create: write(c, "POST", `${a}/summary_emails.json`, "Create a summary email. body: frequency (array), config, company_id, user_id or email, filters."),
        update: write(c, "PUT", `${a}/summary_emails/{summary_email_id}.json`, "Update a summary email. body: frequency, config, filters.", ["summary_email_id"]),
        delete: write(c, "DELETE", `${a}/summary_emails/{summary_email_id}.json`, "Delete a summary email.", ["summary_email_id"], false),
      },
      { title: "Summary emails", description: "Scheduled summary email reports." },
    ),
    leads: router(
      {
        list: read(c, `${a}/leads.json`, "List leads. Query: company_id, sort (created_at, name, email), fields."),
        timeline: read(c, `${a}/leads/{lead_id}/timeline.json`, "Interaction timeline of a lead. Query: page, per_page, sort, fields.", ["lead_id"]),
      },
      { title: "Leads", description: "Leads and their timelines." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { callrail: callrail.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.callrail ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "CallRail",
        description:
          "Call tracking and attribution: calls, texts, form submissions, trackers, companies, tags, users, integrations and reports. accountId is optional when the key reaches one account; pass filters in query and fields in body. Lists use page and per_page.",
        icons,
      },
    ),
  }),
);
