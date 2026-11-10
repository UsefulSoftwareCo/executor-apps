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
  oauth2,
  object,
  query,
  router,
  string,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.ticktick.com/open/v1";

// TickTick's Open API has no user endpoint; listing projects is the cheapest authenticated read.
const ticktick = defineProvider({
  name: "TickTick",
  hosts: ["api.ticktick.com", "ticktick.com"],
  auth: {
    // TickTick has no dynamic client registration: the connect page asks for the client of an app
    // created at https://developer.ticktick.com/manage.
    oauth: oauth2({
      authorizationUrl: "https://ticktick.com/oauth/authorize",
      tokenUrl: "https://ticktick.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopeSeparator: " ",
      scopes: ["tasks:read", "tasks:write"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${api}/project`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    await decodeJson(response, array(object({ id: string() })));
    return { accountInfo: { displayName: "TickTick" } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Field = [name: string, type: Type, required: boolean, where: "path" | "body" | "query"];

const s = (name: string, required = false): Field => [name, "string", required, "body"];
const n = (name: string, required = false): Field => [name, "number", required, "body"];
const b = (name: string, required = false): Field => [name, "boolean", required, "body"];
const q = (name: string, type: Type = "number"): Field => [name, type, false, "query"];
const j = (name: string, required = false): Field => [name, "json", required, "body"];

const task = [
  s("title"),
  s("content"),
  s("desc"),
  b("isAllDay"),
  s("startDate"),
  s("dueDate"),
  s("timeZone"),
  j("reminders"),
  s("repeatFlag"),
  n("priority"),
  n("sortOrder"),
  j("items"),
  j("tags"),
];
const dates =
  "Dates are ISO 8601 with an offset, for example 2026-01-31T09:00:00+0000. priority is 0 none, 1 low, 3 medium, 5 high.";

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

const rows: Row[] = [
  ["projects", "list", "GET", "/project", "List the user's projects. The Inbox is not included; its id looks like inbox<number> and can be read from a task's projectId. offset and limit paginate; when either is given the limit defaults to 200.", [q("offset"), q("limit")]],
  ["projects", "get", "GET", "/project/{projectId}", "Retrieve a project.", []],
  ["projects", "getData", "GET", "/project/{projectId}/data", "Retrieve a project together with its undone tasks and kanban columns. Use projectId inbox<number> for the Inbox.", []],
  ["projects", "create", "POST", "/project", "Create a project. viewMode is list, kanban or timeline; kind is TASK or NOTE.", [s("name", true), s("color"), n("sortOrder"), s("viewMode"), s("kind")]],
  ["projects", "update", "POST", "/project/{projectId}", "Update a project's name, color, sort order, view mode or kind.", [s("name"), s("color"), n("sortOrder"), s("viewMode"), s("kind")]],
  ["projects", "delete", "DELETE", "/project/{projectId}", "Delete a project.", []],
  ["tasks", "get", "GET", "/project/{projectId}/task/{taskId}", "Retrieve a task.", []],
  ["tasks", "create", "POST", "/task", `Create a task in a project. ${dates} items are checklist subtasks with title, status (0 undone, 1 done), startDate and isAllDay.`, [s("title", true), s("projectId", true), ...task.slice(1)]],
  ["tasks", "update", "POST", "/task/{taskId}", `Update a task. projectId is required. ${dates}`, [s("projectId", true), ...task]],
  ["tasks", "complete", "POST", "/project/{projectId}/task/{taskId}/complete", "Mark a task completed.", []],
  ["tasks", "delete", "DELETE", "/project/{projectId}/task/{taskId}", "Delete a task.", []],
  ["tasks", "move", "POST", "/task/move", "Move tasks between projects. Body is a list of { fromProjectId, toProjectId, taskId }.", [j("moves", true)]],
  ["tasks", "search", "POST", "/task/search", "Search tasks by keywords (must not be blank), with optional projectIds, tags (list), status (list of 0 undone, 2 completed), dueFrom and dueTo (ISO 8601).", [s("keywords"), j("projectIds"), j("tags"), j("status"), s("dueFrom"), s("dueTo")]],
  ["tasks", "listUndone", "POST", "/task/undone", "List undone tasks in a date range of at most 14 days. startDate and endDate are required ISO 8601. projectIds may include inbox; omit to search all projects. taskIds restricts results.", [s("startDate", true), s("endDate", true), j("projectIds"), j("taskIds")]],
  ["tasks", "completeMany", "POST", "/task/completeTasks", "Complete up to 50 tasks in one project (only the first 50 ids are processed). projectId defaults to the Inbox.", [s("projectId"), j("taskIds", true)]],
  ["tags", "list", "GET", "/tag", "List the user's tags.", []],
  ["tasks", "listCompleted", "POST", "/task/completed", "List completed tasks, optionally limited to projects and a date range (startDate, endDate).", [j("projectIds"), s("startDate"), s("endDate")]],
  ["tasks", "filter", "POST", "/task/filter", "Filter tasks across projects by projectIds, startDate/endDate (compared against the task's startDate, not completedTime), kind (list), priority (list of 0, 1, 3, 5), tag (list) and status (list of 0 undone, 2 completed).", [j("projectIds"), s("startDate"), s("endDate"), j("kind"), j("priority"), j("tag"), j("status")]],
];

function fieldsOf(path: string, extra: Field[]): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "string", true, "path"]);
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

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    let url = path;
    const body: Record<string, unknown> = {};
    const search = new URLSearchParams();
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "path") url = url.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "query") search.set(name, String(value));
      else body[name] = value;
    }
    if (path === "/task/{taskId}") body.id = input.taskId;
    // The move endpoint takes a bare array.
    const payload = path === "/task/move" ? body.moves : body;
    const hasBody = method === "POST";
    const qs = search.toString();
    const response = await fetcher(`${api}${url}${qs ? `?${qs}` : ""}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(payload) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`TickTick answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra] of rows) {
    const fields = fieldsOf(path, extra);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    const tool = method === "GET" || action === "listCompleted" || action === "filter" || action === "search" || action === "listUndone"
      ? query(options, handler as never)
      : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { ticktick: ticktick.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ticktick ?? [],
        (account) =>
          withApprovals(build(account.fields.access_token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "TickTick",
        description: "TickTick projects and tasks: list, create, update, complete, move, delete, search and filter.",
        icons,
      },
    ),
  }),
);
