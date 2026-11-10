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

const base = "https://api.usemotion.com";

const motion = defineProvider({
  name: "Motion",
  hosts: ["api.usemotion.com"],
  auth: {
    // Motion has no OAuth: the user creates an API key under Settings > API in the Motion web app.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/users/me`, {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    const me = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: me.id } };
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: { "X-API-Key": token, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // Delete endpoints do not document their status or body: treat any empty body (204 or 200) as null.
    if (response.status === 204) return null;
    const text = await response.clone().text();
    if (text.trim() === "") return null;
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

// Path placeholders in {braces} become required string inputs. Every tool also takes optional `query` and (writes) `body`.
function placeholders(path: string): string[] {
  return [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
}

function shape(path: string, withBody: false | "optional" | "required") {
  return object({
    ...Object.fromEntries(placeholders(path).map((id) => [id, string({ minLength: 1 })])),
    query: record(json()).optional(),
    ...(withBody === false ? {} : { body: withBody === "required" ? record(json()) : record(json()).optional() }),
  });
}

function resolve(path: string, input: Params) {
  return path.replace(/\{(\w+)\}/g, (_, id: string) => encodeURIComponent(String(input[id])));
}

function read(c: Call, path: string, description: string) {
  return query({ description, input: shape(path, false) }, async (_ctx, input: Params) =>
    c("GET", resolve(path, input), (input.query as Params | undefined) ?? {}),
  );
}

function write(c: Call, method: Exclude<Method, "GET">, path: string, description: string, withBody: false | "required" = "required") {
  return mutation({ description, input: shape(path, withBody) }, async (_ctx, input: Params) =>
    c(method, resolve(path, input), (input.query as Params | undefined) ?? {}, withBody === false ? undefined : (input.body as Params)),
  );
}

const customFieldTypes =
  'type is one of "text", "url", "date", "person", "multiPerson", "phone", "select", "multiSelect", "number", "email", "checkbox", "relatedTo"';

function build(c: Call) {
  return router({
    users: router(
      {
        me: read(c, "/v1/users/me", "Get the user who owns this API key."),
        list: read(c, "/v1/users", "List users in a workspace or team. query: {workspaceId?, teamId?, cursor?}."),
      },
      { title: "Users", description: "The API key's owner and workspace members." },
    ),
    workspaces: router(
      {
        list: read(c, "/v1/workspaces", "List workspaces the user belongs to. query: {ids?: string[], cursor?}."),
      },
      { title: "Workspaces", description: "Workspaces the user is a member of." },
    ),
    tasks: router(
      {
        list: read(
          c,
          "/v1/tasks",
          "List tasks. query: {workspaceId?, projectId?, assigneeId?, label?, name?, status?: string[], includeAllStatuses?: boolean, cursor?}. status and includeAllStatuses cannot be combined. Omitting workspaceId returns tasks from every workspace.",
        ),
        get: read(c, "/v1/tasks/{id}", "Get a task by id."),
        create: write(
          c,
          "POST",
          "/v1/tasks",
          "Create a task. body: {name, workspaceId, dueDate? (ISO 8601, required for auto-scheduled tasks), duration? (\"NONE\", \"REMINDER\" or minutes), status?, autoScheduled? ({startDate, deadlineType: HARD|SOFT|NONE, schedule} or null), projectId?, description? (GitHub Flavored Markdown), priority? (ASAP|HIGH|MEDIUM|LOW), labels?: string[], assigneeId?}.",
        ),
        update: write(
          c,
          "PATCH",
          "/v1/tasks/{id}",
          "Update a task. body takes the same fields as tasks.create (name and workspaceId are listed as required by Motion).",
        ),
        move: write(c, "PATCH", "/v1/tasks/{id}/move", "Move a task to another workspace. body: {workspaceId, assigneeId?}."),
        unassign: write(c, "DELETE", "/v1/tasks/{id}/assignee", "Remove the assignee of a task.", false),
        delete: write(c, "DELETE", "/v1/tasks/{id}", "Delete a task.", false),
      },
      { title: "Tasks", description: "Create, schedule, assign, move and delete tasks." },
    ),
    recurringTasks: router(
      {
        list: read(c, "/v1/recurring-tasks", "List recurring tasks. query: {workspaceId (required), cursor?}."),
        create: write(
          c,
          "POST",
          "/v1/recurring-tasks",
          "Create a recurring task. body: {name, workspaceId, assigneeId, frequency (see Motion's frequency cookbook), deadlineType? (HARD|SOFT), duration? (minutes or \"REMINDER\"), startingOn? (ISO 8601), idealTime? (HH:mm), schedule? (default \"Work Hours\"), description?, priority? (HIGH|MEDIUM)}.",
        ),
        delete: write(c, "DELETE", "/v1/recurring-tasks/{id}", "Delete a recurring task.", false),
      },
      { title: "Recurring tasks", description: "Tasks Motion schedules on a repeating frequency." },
    ),
    projects: router(
      {
        list: read(c, "/v1/projects", "List projects. query: {workspaceId?, cursor?}."),
        get: read(c, "/v1/projects/{id}", "Get a project by id."),
        create: write(
          c,
          "POST",
          "/v1/projects",
          "Create a project. body: {name, workspaceId, dueDate? (ISO 8601), description? (HTML), labels?: string[], priority? (ASAP|HIGH|MEDIUM|LOW), projectDefinitionId? (template; then stages is required), stages?: [{stageDefinitionId, dueDate, variableInstances?: [{variableName, value}]}]}.",
        ),
      },
      { title: "Projects", description: "Projects, optionally created from a template." },
    ),
    comments: router(
      {
        list: read(c, "/v1/comments", "List comments on a task. query: {taskId (required), cursor?}."),
        create: write(c, "POST", "/v1/comments", "Comment on a task. body: {taskId, content (GitHub Flavored Markdown)}."),
      },
      { title: "Comments", description: "Comments on tasks." },
    ),
    customFields: router(
      {
        list: read(c, "/beta/workspaces/{workspaceId}/custom-fields", "List custom fields in a workspace."),
        create: write(
          c,
          "POST",
          "/beta/workspaces/{workspaceId}/custom-fields",
          `Create a custom field. body: {type, name, metadata?: {format?: plain|formatted|percent (number), toggle?: boolean (checkbox), options?: [{id?, value, color?}] (select/multiSelect)}}; ${customFieldTypes}.`,
        ),
        delete: write(c, "DELETE", "/beta/workspaces/{workspaceId}/custom-fields/{id}", "Delete a custom field.", false),
        addToTask: write(
          c,
          "POST",
          "/beta/custom-field-values/task/{taskId}",
          `Set a custom field value on a task. body: {customFieldInstanceId, value: {type, value?: string|number}}; ${customFieldTypes}.`,
        ),
        removeFromTask: write(c, "DELETE", "/beta/custom-field-values/task/{taskId}/custom-fields/{valueId}", "Remove a custom field value from a task.", false),
        addToProject: write(
          c,
          "POST",
          "/beta/custom-field-values/project/{projectId}",
          `Set a custom field value on a project. body: {customFieldInstanceId, value: {type, value?: string|number}}; ${customFieldTypes}.`,
        ),
        removeFromProject: write(c, "DELETE", "/beta/custom-field-values/project/{projectId}/custom-fields/{valueId}", "Remove a custom field value from a project.", false),
      },
      { title: "Custom fields", description: "Workspace custom fields and their values on tasks and projects (beta API)." },
    ),
    schedules: router(
      { list: read(c, "/v1/schedules", "List the user's schedules (work hours and others a task can adhere to).") },
      { title: "Schedules", description: "Schedules tasks can be constrained to." },
    ),
    statuses: router(
      { list: read(c, "/v1/statuses", "List task statuses. query: {workspaceId?}.") },
      { title: "Statuses", description: "Task statuses of a workspace." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { motion: motion.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.motion ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Motion",
        description: "Motion (usemotion.com) AI calendar and project management: tasks, recurring tasks, projects, comments, custom fields, schedules, statuses, users and workspaces.",
        instructions:
          "Tools take path ids as named inputs plus optional `query` (URL parameters) and, for writes, a `body` object. List endpoints are cursor-paginated: pass the previous response's meta.nextCursor as query.cursor. Motion rate-limits per API key (see its rate limits cookbook).",
        icons,
      },
    ),
  }),
);
