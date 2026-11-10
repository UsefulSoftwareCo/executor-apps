import {
  accountRouter,
  defineApp,
  defineProvider,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { buildXml, parseXml } from "./xml.js";

const base = "https://api.worksnaps.com/api";

const worksnaps = defineProvider({
  name: "Worksnaps",
  hosts: ["api.worksnaps.com"],
  auth: {
    // Worksnaps has no OAuth: every user has an API token (Profile & Settings > Web Service API) sent as the Basic auth username.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me.xml`, { signal, headers: { Authorization: authorization(account.fields.token), Accept: "application/xml" } });
    if (!response.ok) throw new Error(`Worksnaps answered ${response.status}`);
    const parsed = parseXml(await response.text()) as { user?: { id?: unknown; email?: unknown; login?: unknown } } | null;
    const id = parsed?.user?.id;
    if (id === undefined || id === null) throw new Error("Worksnaps /me.xml did not return a user");
    return { accountInfo: { externalId: String(id), displayName: String(parsed?.user?.login ?? id) } };
  },
});

function authorization(token: string) {
  return `Basic ${btoa(`${token}:ignored`)}`;
}

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: string) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: authorization(token),
        Accept: "application/xml",
        ...(body === undefined ? {} : { "Content-Type": "application/xml" }),
      },
      ...(body === undefined ? {} : { body }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Worksnaps ${method} ${path} failed with ${response.status}: ${text.slice(0, 500)}`);
    return text.trim() === "" ? { ok: true } : parseXml(text);
  };
}

type Call = ReturnType<typeof client>;

const id = () => number();

// Fields the API takes as numbers (ids, rates, flags, durations, Unix-second timestamps); every other field is text.
const numeric = new Set(["user_id", "task_id", "timezone_id", "hourly_rate", "flag_allow_logging_time", "window_for_deleting_time", "window_for_adding_offline_time", "from_timestamp", "to_timestamp", "duration_in_minutes"]);
const typed = (name: string, required: boolean) => {
  const base = numeric.has(name) ? number() : string();
  return required ? base : base.optional();
};

// Path ids are substituted into {braces}; `fields` become the XML request body under `root`; `searchKeys` are sent as the query string.
type Spec = { description: string; method: Method; path: string; pathIds?: readonly string[]; search?: readonly string[]; root?: string; fields?: readonly string[]; required?: readonly string[] };

function operation(call: Call, spec: Spec) {
  const shape: Record<string, any> = {};
  for (const name of spec.pathIds ?? []) shape[name] = id();
  for (const name of spec.search ?? []) shape[name] = typed(name, spec.required?.includes(name) ?? false);
  for (const name of spec.fields ?? []) shape[name] = typed(name, spec.required?.includes(name) ?? false);
  const handler = async (_ctx: unknown, input: Params) => {
    let path = spec.path;
    for (const name of spec.pathIds ?? []) path = path.replace(`{${name}}`, encodeURIComponent(String(input[name])));
    const search: Params = {};
    for (const name of spec.search ?? []) search[name] = input[name];
    const fields: Params = {};
    for (const name of spec.fields ?? []) fields[name] = input[name];
    return call(spec.method, path, search, spec.root ? buildXml(spec.root, fields) : undefined);
  };
  const options = { description: spec.description, input: object(shape) };
  return spec.method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
}

const timeWindow = ["from_timestamp", "to_timestamp", "time_entry_type"] as const;

function build(call: Call) {
  const op = (spec: Spec) => operation(call, spec);
  return router({
    me: op({ description: "Get the user the API token belongs to.", method: "GET", path: "/me.xml" }),
    users: router(
      {
        list: op({ description: "List users visible to the token (account owner or managers).", method: "GET", path: "/users.xml" }),
        get: op({ description: "Get a user by id.", method: "GET", path: "/users/{user_id}.xml", pathIds: ["user_id"] }),
        create: op({ description: "Create a user. Requires a partner API token: Worksnaps only lets trusted partners create users, so an end-user token is rejected.", method: "POST", path: "/users.xml", root: "user", fields: ["login", "first_name", "last_name", "password", "email", "timezone_id"], required: ["login", "first_name", "last_name", "password", "email"] }),
        update: op({ description: "Update a user. Send only the fields to change. Per the vendor Swagger this can be done by the user himself or by a trusted partner using a partner API token; the vendor does not document whether managers or owners may update other users.", method: "PUT", path: "/users/{user_id}.xml", pathIds: ["user_id"], root: "user", fields: ["login", "first_name", "last_name", "password", "email", "timezone_id"] }),
      },
      { title: "Users", description: "Worksnaps user accounts." },
    ),
    projects: router(
      {
        list: op({ description: "List projects.", method: "GET", path: "/projects.xml" }),
        get: op({ description: "Get a project.", method: "GET", path: "/projects/{project_id}.xml", pathIds: ["project_id"] }),
        create: op({ description: "Create a project.", method: "POST", path: "/projects.xml", root: "project", fields: ["name", "description"], required: ["name"] }),
        update: op({ description: "Update a project.", method: "PUT", path: "/projects/{project_id}.xml", pathIds: ["project_id"], root: "project", fields: ["name", "description"] }),
        delete: op({ description: "Delete a project.", method: "DELETE", path: "/projects/{project_id}.xml", pathIds: ["project_id"] }),
      },
      { title: "Projects", description: "Projects that time is logged against." },
    ),
    tasks: router(
      {
        list: op({ description: "List the tasks in a project.", method: "GET", path: "/projects/{project_id}/tasks.xml", pathIds: ["project_id"] }),
        get: op({ description: "Get a task.", method: "GET", path: "/projects/{project_id}/tasks/{task_id}.xml", pathIds: ["project_id", "task_id"] }),
        create: op({ description: "Create a task in a project.", method: "POST", path: "/projects/{project_id}/tasks.xml", pathIds: ["project_id"], root: "task", fields: ["name", "description"], required: ["name"] }),
        update: op({ description: "Update a task.", method: "PUT", path: "/projects/{project_id}/tasks/{task_id}.xml", pathIds: ["project_id", "task_id"], root: "task", fields: ["name", "description"] }),
        delete: op({ description: "Delete a task.", method: "DELETE", path: "/projects/{project_id}/tasks/{task_id}.xml", pathIds: ["project_id", "task_id"] }),
      },
      { title: "Tasks", description: "Tasks inside a project." },
    ),
    userAssignments: router(
      {
        list: op({ description: "List the users assigned to a project.", method: "GET", path: "/projects/{project_id}/user_assignments.xml", pathIds: ["project_id"] }),
        get: op({ description: "Get a user assignment.", method: "GET", path: "/projects/{project_id}/user_assignments/{user_assignment_id}.xml", pathIds: ["project_id", "user_assignment_id"] }),
        create: op({ description: "Assign a user to a project. role is manager or member; flag_allow_logging_time is 1 or 0; window_for_* are day counts (-1 always, 0 never).", method: "POST", path: "/projects/{project_id}/user_assignments.xml", pathIds: ["project_id"], root: "user_assignment", fields: ["user_id", "role", "hourly_rate", "flag_allow_logging_time", "window_for_deleting_time", "window_for_adding_offline_time"], required: ["user_id"] }),
        update: op({ description: "Update a user assignment.", method: "PUT", path: "/projects/{project_id}/user_assignments/{user_assignment_id}.xml", pathIds: ["project_id", "user_assignment_id"], root: "user_assignment", fields: ["role", "hourly_rate", "flag_allow_logging_time", "window_for_deleting_time", "window_for_adding_offline_time"] }),
        delete: op({ description: "Remove a user from a project.", method: "DELETE", path: "/projects/{project_id}/user_assignments/{user_assignment_id}.xml", pathIds: ["project_id", "user_assignment_id"] }),
      },
      { title: "User assignments", description: "Which users belong to which project, with role and rate." },
    ),
    taskAssignments: router(
      {
        list: op({ description: "List task assignments in a project.", method: "GET", path: "/projects/{project_id}/task_assignments.xml", pathIds: ["project_id"] }),
        get: op({ description: "Get a task assignment.", method: "GET", path: "/projects/{project_id}/task_assignments/{task_assignment_id}.xml", pathIds: ["project_id", "task_assignment_id"] }),
        create: op({ description: "Assign a user to a task.", method: "POST", path: "/projects/{project_id}/task_assignments.xml", pathIds: ["project_id"], root: "task_assignment", fields: ["user_id", "task_id"], required: ["user_id", "task_id"] }),
        delete: op({ description: "Delete a task assignment by id.", method: "DELETE", path: "/projects/{project_id}/task_assignments/{task_assignment_id}.xml", pathIds: ["project_id", "task_assignment_id"] }),
        deleteByUserAndTask: op({ description: "Delete a task assignment by user id and task id.", method: "DELETE", path: "/projects/{project_id}/task_assignments.xml", pathIds: ["project_id"], search: ["user_id", "task_id"], required: ["user_id", "task_id"] }),
      },
      { title: "Task assignments", description: "Which users are assigned to which task." },
    ),
    timeEntries: router(
      {
        listForProject: op({ description: "List time entries in a project for one or more users. user_ids is semicolon-separated; timestamps are Unix seconds on a 10-minute boundary; time_entry_type is online or offline.", method: "GET", path: "/projects/{project_id}/time_entries.xml", pathIds: ["project_id"], search: ["user_ids", "task_ids", ...timeWindow], required: ["user_ids", "from_timestamp", "to_timestamp"] }),
        listForUser: op({ description: "List a user's time entries in a project. Timestamps are Unix seconds on a 10-minute boundary.", method: "GET", path: "/projects/{project_id}/users/{user_id}/time_entries.xml", pathIds: ["project_id", "user_id"], search: [...timeWindow], required: ["from_timestamp", "to_timestamp"] }),
        get: op({ description: "Get a time entry.", method: "GET", path: "/projects/{project_id}/time_entries/{time_entry_id}.xml", pathIds: ["project_id", "time_entry_id"] }),
        getFullResolution: op({ description: "Get a time entry with the full-resolution screenshot URL. Pass full_resolution_url as 1.", method: "GET", path: "/projects/{project_id}/time_entries/{time_entry_id}.xml", pathIds: ["project_id", "time_entry_id"], search: ["full_resolution_url"] }),
        createForSelf: op({ description: "Log offline time for yourself. from_timestamp is Unix seconds on a 10-minute boundary; duration_in_minutes is a multiple of 10.", method: "POST", path: "/projects/{project_id}/time_entries.xml", pathIds: ["project_id"], root: "time_entry", fields: ["task_id", "user_comment", "from_timestamp", "duration_in_minutes"], required: ["task_id", "from_timestamp", "duration_in_minutes"] }),
        createForUser: op({ description: "Log offline time for another user (requires manager rights).", method: "POST", path: "/projects/{project_id}/users/{user_id}/time_entries.xml", pathIds: ["project_id", "user_id"], root: "time_entry", fields: ["task_id", "user_comment", "from_timestamp", "duration_in_minutes"], required: ["task_id", "from_timestamp", "duration_in_minutes"] }),
        update: op({ description: "Change the task or comment of a time entry.", method: "PUT", path: "/projects/{project_id}/time_entries/{time_entry_id}.xml", pathIds: ["project_id", "time_entry_id"], root: "time_entry", fields: ["task_id", "user_comment"] }),
        delete: op({ description: "Delete a time entry.", method: "DELETE", path: "/projects/{project_id}/time_entries/{time_entry_id}.xml", pathIds: ["project_id", "time_entry_id"] }),
      },
      { title: "Time entries", description: "Logged time in 10-minute blocks, online or offline." },
    ),
    reports: router(
      {
        project: op({ description: "Project report. name is time_entries or time_summary; user_ids is semicolon-separated; the window is at most 30 days of Unix seconds on a 10-minute boundary.", method: "GET", path: "/projects/{project_id}/reports", pathIds: ["project_id"], search: ["name", "user_ids", "task_ids", ...timeWindow], required: ["name", "user_ids", "from_timestamp", "to_timestamp"] }),
        manager: op({ description: "Time report across the projects and users you manage. Dates are YYYY-MM-DD, at most 30 days apart; project_ids and user_ids are semicolon-separated.", method: "GET", path: "/summary_reports", search: ["from_date", "to_date", "timezone_offset", "name", "project_ids", "user_ids"], required: ["from_date", "to_date", "name"] }),
      },
      { title: "Reports", description: "Time entry and time summary reports." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { worksnaps: worksnaps.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.worksnaps ?? [],
        (account) => withApprovals(build(client(account.fields.token, fetch, signal)), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Worksnaps",
        description: "Time tracking in Worksnaps: projects, tasks, users, assignments, time entries and reports. Replies are the vendor's XML converted to JSON.",
        instructions: "Timestamps are Unix seconds on a 10-minute boundary and report windows are at most 30 days. Pass id lists as semicolon-separated strings. Request bodies are given as top-level fields; the XML is built for you. For manager_report, name is the constant manager_report.",
        icons,
      },
    ),
  }),
);
