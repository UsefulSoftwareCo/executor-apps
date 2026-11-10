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
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://rest.tsheets.com/api/v1";

// QuickBooks Time (TSheets) documents OAuth 2.0 at /authorize and /grant. It has no scopes, no
// published OIDC/RFC 8414 metadata, and answers token requests as form-encoded POSTs.
const quickbooksTime = defineProvider({
  name: "QuickBooks Time",
  hosts: ["rest.tsheets.com"],
  auth: {
    accessToken: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    oauth: oauth2({
      authorizationUrl: "https://rest.tsheets.com/api/v1/authorize",
      tokenUrl: "https://rest.tsheets.com/api/v1/grant",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "form",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${api}/current_user`, {
      signal,
      headers: { Authorization: `Bearer ${bearer(account)}`, Accept: "application/json" },
    });
    // results.users is keyed by user id, so the id is not a fixed field.
    await decodeJson(response, object({ results: json() }));
  },
});

type Account = { method: "accessToken"; fields: { token: string } } | { method: "oauth"; fields: { access_token: string } };

function bearer(account: Account): string {
  return account.method === "oauth" ? account.fields.access_token : account.fields.token;
}

type Type = "string" | "number" | "json";
type Where = "query" | "body";
type Field = [name: string, type: Type, required: boolean, where: Where];

const s = (name: string, required = false): Field => [name, "string", required, "query"];
const n = (name: string): Field => [name, "number", false, "query"];
const body = (required = true): Field => ["data", "json", required, "body"];

// Every list endpoint pages (up to 200 results) and supports incremental sync.
const paging: Field[] = [s("modified_before"), s("modified_since"), n("page"), n("per_page"), s("supplemental_data")];

interface Row {
  group: string;
  action: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  fields: Field[];
  // A POST that only reads (reports): classified as a query.
  readOnly?: boolean;
}

const rows: Row[] = [];

function resource(
  group: string,
  path: string,
  label: string,
  list: Field[],
  options: { create?: boolean; update?: boolean; del?: boolean; noPaging?: boolean; note?: string } = {},
) {
  const note = options.note === undefined ? "" : ` ${options.note}`;
  rows.push({
    group,
    action: "list",
    method: "GET",
    path,
    description: `List ${label}. Filters that take several values accept comma-separated lists. Returns results keyed by id, plus "more" (true when another page exists; keep incrementing page) and supplemental_data (related records; pass supplemental_data "no" to omit).${note}`,
    fields: [...list, ...(options.noPaging === true ? [] : paging)],
  });
  if (options.create === true) {
    rows.push({
      group,
      action: "create",
      method: "POST",
      path,
      description: `Create ${label}. data is an array of up to 200 objects as documented at https://tsheetsteam.github.io/api_docs/.${note}`,
      fields: [body()],
    });
  }
  if (options.update === true) {
    rows.push({
      group,
      action: "update",
      method: "PUT",
      path,
      description: `Update ${label}. data is an array of up to 200 objects, each with its id and the fields to change.${note}`,
      fields: [body()],
    });
  }
  if (options.del === true) {
    rows.push({
      group,
      action: "delete",
      method: "DELETE",
      path,
      description: `Permanently delete ${label} by id.`,
      fields: [s("ids", true)],
    });
  }
}

rows.push({
  group: "currentUser",
  action: "get",
  method: "GET",
  path: "/current_user",
  description: "The authenticated user, including company name, permissions and timezone.",
  fields: [s("supplemental_data")],
});

resource(
  "timesheets",
  "/timesheets",
  "timesheets (time entries)",
  [
    s("ids"), s("start_date"), s("end_date"), s("jobcode_ids"), s("payroll_ids"), s("user_ids"), s("group_ids"),
    s("on_the_clock"), s("jobcode_type"),
  ],
  {
    create: true,
    update: true,
    del: true,
    note: "start_date and end_date are YYYY-MM-DD and are required unless ids is given. A timesheet is regular (start, end, jobcode_id, user_id) or manual (date, duration in seconds); a timesheet with an empty end is on the clock.",
  },
);
resource("timesheetsDeleted", "/timesheets_deleted", "deleted timesheets", [s("ids"), s("start_date"), s("end_date"), s("jobcode_ids"), s("user_ids"), s("group_ids")]);
resource(
  "users",
  "/users",
  "users",
  [
    s("ids"), s("not_ids"), s("employee_numbers"), s("usernames"), s("group_ids"), s("not_group_ids"),
    s("payroll_ids"), s("active"), s("first_name"), s("last_name"), s("name"),
  ],
  { create: true, update: true, note: "Users are never deleted: archive one by updating it with active false." },
);
resource("groups", "/groups", "groups", [s("ids"), s("active"), s("manager_ids"), s("name")], { create: true, update: true });
resource(
  "jobcodes",
  "/jobcodes",
  "jobcodes (jobs, tasks and customers)",
  [s("ids"), s("parent_ids"), s("name"), s("type"), s("active"), s("customer_ids"), s("project_ids")],
  { create: true, update: true },
);
resource(
  "jobcodeAssignments",
  "/jobcode_assignments",
  "jobcode assignments (which users may use which jobcodes)",
  [s("user_ids"), s("jobcode_id"), s("jobcode_parent_id"), s("type"), s("active_users")],
  { create: true, del: true },
);
resource("locations", "/locations", "locations (addresses)", [s("ids"), s("active")], { create: true, update: true });
rows.push({
  group: "locations",
  action: "map",
  method: "GET",
  path: "/locations_map",
  description: "Links between locations and the objects (users, jobcodes) they are mapped to.",
  fields: [s("ids"), s("location_ids"), s("jobcode_ids"), s("user_ids"), s("page")].map((f) => f),
});
resource("geolocations", "/geolocations", "geolocations (GPS points recorded for users)", [s("ids")], { create: true });
resource("geofenceConfigs", "/geofence_configs", "geofence configurations", [s("ids"), s("active"), s("type")]);
resource("customFields", "/customfields", "custom fields", [s("ids"), s("applies_to"), s("active"), s("value_type")], { create: true, update: true });
resource("customFieldItems", "/customfielditems", "custom field items (dropdown values)", [s("customfield_id"), s("ids"), s("active")], { create: true, update: true });
resource("scheduleCalendars", "/schedule_calendars", "schedule calendars", [s("ids"), s("name")]);
resource(
  "scheduleEvents",
  "/schedule_events",
  "schedule events (scheduled shifts)",
  [s("ids"), s("start"), s("end"), s("schedule_calendar_ids"), s("user_ids"), s("jobcode_ids"), s("active"), s("draft")],
  { create: true, update: true },
);
resource("timeOffRequests", "/time_off_requests", "time off requests", [s("ids"), s("status"), s("user_ids"), s("start_date"), s("end_date")], { create: true, update: true });
resource(
  "timeOffRequestEntries",
  "/time_off_request_entries",
  "time off request entries (the individual days of a request)",
  [s("ids"), s("time_off_request_ids"), s("user_ids"), s("status"), s("start_date"), s("end_date")],
  { create: true, update: true },
);
resource("reminders", "/reminders", "reminders", [s("ids"), s("user_ids"), s("reminder_type"), s("enabled")], { create: true, update: true });
resource("notifications", "/notifications", "notifications", [s("ids"), s("user_ids"), s("active")], { create: true, del: true });
resource("projects", "/projects", "projects", [s("ids"), s("jobcode_ids"), s("customer_ids"), s("name"), s("status"), s("active")], { create: true, update: true });
resource("projectNotes", "/project_notes", "project notes", [s("ids"), s("project_ids"), s("user_ids"), s("active")], { create: true, update: true });
resource("projectActivities", "/project_activities", "project activity feed entries", [s("ids"), s("project_ids"), s("user_ids"), s("activity_type"), s("start_date"), s("end_date")]);
resource("projectActivityReplies", "/project_activity_replies", "replies to project activity entries", [s("ids"), s("project_activity_ids"), s("user_ids"), s("active")], { create: true, update: true });
resource("projectActivityReadTimes", "/project_activity_read_times", "times users last read project activity", [s("ids"), s("project_ids"), s("user_ids")], { update: true });
resource("estimates", "/estimates", "estimates (project budgets)", [s("ids"), s("project_ids"), s("active")], { create: true, update: true });
resource("estimateItems", "/estimate_items", "estimate items", [s("ids"), s("estimate_ids"), s("active")], { create: true, update: true });
resource("files", "/files", "file records (metadata of attachments)", [s("ids"), s("object_type"), s("object_ids"), s("active")], { update: true, del: true });
resource("managedClients", "/managed_clients", "clients managed by an accounting firm account", [s("ids"), s("active")]);
rows.push(
  {
    group: "settings",
    action: "effective",
    method: "GET",
    path: "/effective_settings",
    description: "The effective company settings for a user (timesheet, scheduling and mobile settings after group overrides).",
    fields: [s("user_ids"), s("modified_before"), s("modified_since"), s("supplemental_data")],
  },
  {
    group: "settings",
    action: "lastModified",
    method: "GET",
    path: "/last_modified_timestamps",
    description: "The last modification time of each object type, for cheap change detection. endpoints is an optional comma-separated list such as \"timesheets,users\".",
    fields: [s("endpoints")],
  },
);

// Reports: POST /reports/<name> with { data: { ...filters } }. They only read.
const reports: [action: string, path: string, description: string][] = [
  ["currentTotals", "current_totals", "Who is on the clock now and each user's shift and day totals. data may set on_the_clock (\"user\", \"group\", \"both\" or \"none\"), user_ids, group_ids, and advanced_totals."],
  ["payroll", "payroll", "Payroll hours per user for a date range. data needs start_date and end_date (YYYY-MM-DD) and may set user_ids, group_ids, payroll_ids and include_zero_time."],
  ["payrollByJobcode", "payroll_by_jobcode", "Payroll hours per user broken down by jobcode. data needs start_date and end_date and may set user_ids, group_ids, jobcode_ids."],
  ["project", "project", "Project report: time and attached notes per project for a date range. data needs start_date, end_date and project ids (project_ids)."],
  ["projectEstimate", "project_estimate", "Project estimate report: hours worked against the estimate. data takes project_ids."],
  ["projectEstimateDetail", "project_estimate_detail", "Project estimate detail report: hours worked against each estimate item. data takes project_ids."],
];
for (const [action, path, description] of reports) {
  rows.push({
    group: "reports",
    action,
    method: "POST",
    path: `/reports/${path}`,
    readOnly: true,
    description: `${description} data is the report's filter object.`,
    fields: [body()],
  });
}

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> = type === "number" ? number() : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  const params = fields.map(([name, type, required]) => `- ${name} (${type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const headers = { Authorization: `Bearer ${bearer(account)}`, Accept: "application/json" };

  const call = async (row: Row, input: Record<string, unknown>) => {
    const search = new URLSearchParams();
    let payload: unknown;
    for (const [name, , , where] of row.fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "query") search.set(name, String(value));
      else payload = { data: value };
    }
    const qs = search.toString();
    const response = await fetcher(`${api}${row.path}${qs === "" ? "" : `?${qs}`}`, {
      method: row.method,
      signal,
      headers: payload === undefined ? headers : { ...headers, "content-type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`QuickBooks Time answered ${response.status}: ${text.slice(0, 1500)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const options = { description: describe(row.description, row.fields), input: schemaFor(row.fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(row, input);
    const isQuery = row.method === "GET" || row.readOnly === true;
    const tool = isQuery ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(row.group) ?? {};
    group[row.action] = tool;
    groups.set(row.group, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { quickbooksTime: quickbooksTime.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.quickbooksTime ?? [],
        (account) =>
          withApprovals(build(account as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "QuickBooks Time",
        description:
          "QuickBooks Time (formerly TSheets): timesheets, users, groups, jobcodes, schedules, time off, locations, projects, estimates and payroll reports.",
        instructions:
          "List tools return up to 200 records per page; keep incrementing page until more is false. Write tools take data, an array of up to 200 objects (an object for reports). Dates are YYYY-MM-DD, timestamps ISO 8601 with offset, durations in seconds.",
        icons,
      },
    ),
  }),
);
