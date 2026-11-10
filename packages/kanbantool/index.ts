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

// Every Kanban Tool account lives on its own host: https://<domain>.kanbantool.com.
const siteUrl = (domain: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,61}[a-z0-9])(?:\.kanbantool\.com)?\/?$/.exec(
    domain.trim().toLowerCase(),
  );
  if (match === null)
    throw new Error("Enter the <domain> of <domain>.kanbantool.com (letters, digits, hyphens).");
  return `https://${match[1]}.kanbantool.com`;
};

const kanbantool = defineProvider({
  name: "Kanban Tool",
  hosts: ["*.kanbantool.com"],
  auth: {
    // Kanban Tool issues personal API tokens (My profile > API access); it has no user-created OAuth apps.
    apiKey: secrets({
      label: "API token",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("authorization", t`Bearer ${token}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.domain)}/api/v3/users/current.json`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ id: number() }));
    return { accountInfo: { externalId: String(me.id) } };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Field = [name: string, type: Type, required: boolean, where: "path" | "query" | "body"];

const s = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "number", required, where];
const b = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "boolean", required, where];
const j = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "json", required, where];

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

const taskBody = [
  s("description"), n("workflow_stage_id"), n("swimlane_id"), n("card_type_id"), n("assigned_user_id"), n("priority"),
  s("tags"), n("time_estimate"), s("size_estimate"), s("due_date"), s("postponed_until"), s("external_id"),
  s("external_link"), s("block_reason"), s("recurring_schedule"),
];

const rows: Row[] = [
  ["users", "current", "GET", "/users/current", "The authenticated user, including the boards they can access and their time trackers.", []],
  ["users", "get", "GET", "/users/{userId}", "Retrieve a user.", []],

  ["boards", "get", "GET", "/boards/{boardId}", "Retrieve a board with its workflow stages, swimlanes, card types, users and all tasks.", []],
  ["boards", "preload", "GET", "/boards/{boardId}/preload", "Retrieve a board without its tasks (faster for large boards).", []],
  ["boards", "changelog", "GET", "/boards/{boardId}/changelog", "List board changelog entries. before and after filter by entry id (before returns ids below it, after returns ids above it); limit caps the count.", [n("before", "query"), n("after", "query"), n("limit", "query")]],

  ["tasks", "search", "GET", "/tasks/search", "Search tasks. q is the query (may be empty): free text, @initials for the assignee, or filters such as board_id=12, priority:1, tags:\"x\", is=in_progress, due_date<2026-01-01, created_at>:2026-01-01. board_id is a comma-separated list. archived=1 searches archived tasks. With page, the response includes pagination info.", [s("q", "query", true), n("limit", "query"), n("page", "query"), s("board_id", "query"), n("archived", "query")]],
  ["tasks", "get", "GET", "/tasks/{taskId}", "Retrieve a task with its comments, subtasks, attachments, time trackers, collaborators and changelogs.", []],
  ["tasks", "preload", "GET", "/tasks/{taskId}/preload", "Retrieve a task without its related objects.", []],
  ["tasks", "create", "POST", "/tasks", "Create a task. Without workflow_stage_id, swimlane_id and card_type_id it lands in the top-left cell with the default card type. priority is -1 low, 0 normal, 1 high; tags is comma-separated; time_estimate is in seconds; due_date is Y-m-d; the card color comes from the card type.", [n("board_id", "body", true), s("name", "body", true), ...taskBody]],
  ["tasks", "update", "PATCH", "/tasks/{taskId}", "Update a task. Moving it to another cell means setting workflow_stage_id and swimlane_id.", [s("name"), ...taskBody]],
  ["tasks", "archive", "PATCH", "/tasks/{taskId}#archive", "Archive a task.", []],
  ["tasks", "unarchive", "PATCH", "/tasks/{taskId}#unarchive", "Restore an archived task.", []],
  ["tasks", "delete", "PATCH", "/tasks/{taskId}#delete", "Soft-delete a task. Kanban Tool offers no permanent deletion.", []],
  ["tasks", "undelete", "PATCH", "/tasks/{taskId}#undelete", "Restore a deleted task.", []],

  ["subtasks", "create", "POST", "/subtasks", "Create a subtask on a task.", [s("name", "body", true), n("task_id"), n("assigned_user_id"), b("is_completed")]],
  ["subtasks", "update", "PATCH", "/subtasks/{subtaskId}", "Update a subtask (rename, assign, complete). Use reorder to change position.", [s("name"), n("task_id"), n("assigned_user_id"), b("is_completed")]],
  ["subtasks", "delete", "DELETE", "/subtasks/{subtaskId}", "Soft-delete a subtask.", []],
  ["subtasks", "reorder", "PUT", "/subtasks/reorder", "Reorder a task's subtasks. ids is a comma-separated list of subtask ids in the new order.", [s("task_id", "body", true), s("ids", "body", true)]],

  ["comments", "create", "POST", "/tasks/{taskId}/comments", "Comment on a task. content supports Markdown.", [s("content", "body", true)]],
  ["comments", "delete", "DELETE", "/tasks/{taskId}/comments/{commentId}", "Soft-delete a comment.", []],

  ["timeTrackers", "create", "POST", "/time_trackers", "Start a time tracker on a task. started_at defaults to now; ended_at (ISO 8601) stops it.", [n("board_id", "body", true), n("task_id", "body", true), n("position"), b("listed"), s("started_at"), s("ended_at"), s("highlighted_at")]],
  ["timeTrackers", "update", "PUT", "/time_trackers/{timeTrackerId}", "Update a time tracker, for example set ended_at to stop it. Times are ISO 8601.", [n("position"), b("listed"), s("started_at"), s("ended_at"), s("highlighted_at")]],
  ["timeTrackers", "delete", "DELETE", "/time_trackers/{timeTrackerId}", "Delete a time tracker.", []],

  ["attachments", "detach", "DELETE", "/attachments/{attachmentId}/detach", "Detach an attachment from its board or task.", [s("attachable", "query")]],
];

function fieldsOf(path: string, extra: Field[]): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "number", true, "path"]);
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
  fields: { domain: string };
  url: (url: string) => string;
  headers: () => Record<string, string>;
};

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = siteUrl(account.fields.domain);

  const call = async (method: string, rawPath: string, fields: Field[], input: Record<string, unknown>) => {
    // "#action" marks lifecycle tools that PATCH /tasks/:id with {_action}.
    const [path, action] = rawPath.split("#") as [string, string | undefined];
    let url = path;
    const search = new URLSearchParams();
    const body: Record<string, unknown> = action === undefined ? {} : { _action: action };
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "path") url = url.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "query") search.set(name, String(value));
      else body[name] = value;
    }
    const hasBody = method !== "GET" && method !== "DELETE" && Object.keys(body).length > 0;
    const queryString = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(account.url(`${base}/api/v3${url}.json${queryString}`), {
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
    if (!response.ok) throw new Error(`Kanban Tool answered ${response.status}: ${text.slice(0, 1000)}`);
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
  { user: { accounts: { kanbantool: kanbantool.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.kanbantool ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Kanban Tool",
        description: "Kanban Tool boards, tasks, subtasks, comments, time trackers and changelogs.",
        icons,
      },
    ),
  }),
);
