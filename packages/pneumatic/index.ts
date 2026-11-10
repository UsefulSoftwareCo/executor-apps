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
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.pneumatic.app";

const pneumatic = defineProvider({
  name: "Pneumatic",
  hosts: ["api.pneumatic.app"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/accounts/users?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | undefined>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST", path: string, options: { params?: Params; body?: unknown } = {}) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params ?? {})) {
      if (value !== undefined) search.set(key, String(value));
    }
    const qs = search.size > 0 ? `?${search}` : "";
    const response = await fetcher(`${base}${path}${qs}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    // Unsubscribe endpoints answer 204 with an empty body.
    if (response.status === 204) return {};
    return decodeJson(response, json());
  };
}

const paging = { limit: number().optional(), offset: number().optional() };

function build(call: ReturnType<typeof client>) {
  return router({
    templates: router(
      {
        list: query(
          {
            description:
              "List workflow templates. ordering is one of date, name, -date, -name (default -date). Paginated with limit (default 20) and offset; returns {count, next, previous, results}. Each result includes the kickoff form fields.",
            input: object({ ordering: string().optional(), ...paging }),
          },
          async (_ctx, { ordering, limit, offset }) => call("GET", "/templates", { params: { ordering, limit, offset } }),
        ),
        get: query(
          {
            description: "Get one template with its kickoff fields, tasks, performers, due dates and conditions.",
            input: object({ templateId: number() }),
          },
          async (_ctx, { templateId }) => call("GET", `/templates/${templateId}`),
        ),
        create: mutation(
          {
            description:
              "Create a template. body is the template JSON: name, description, template_owners (user ids), is_active, is_public, kickoff {description, fields[]} and tasks[] (number, name, description, raw_performers, raw_due_date, fields, conditions...).",
            input: object({ body: record(json()) }),
          },
          async (_ctx, { body }) => call("POST", "/templates", { body }),
        ),
      },
      { title: "Templates", description: "Reusable process definitions." },
    ),
    workflows: router(
      {
        run: mutation(
          {
            description:
              "Launch a workflow from a template. Optional: name, isUrgent, ancestorTaskId (embed in a task), dueDateTsp (timestamp), and kickoff, a map of kickoff field api_name to value (string for text, selection ids list for checkbox, float timestamp for dates, attachment id list for files, user id for user fields). kickoff is required when the template has required kickoff fields. Returns the workflow, including current_task.id.",
            input: object({
              templateId: number(),
              name: string().optional(),
              isUrgent: boolean().optional(),
              ancestorTaskId: number().optional(),
              dueDateTsp: number().optional(),
              kickoff: record(json()).optional(),
            }),
          },
          async (_ctx, { templateId, name, isUrgent, ancestorTaskId, dueDateTsp, kickoff }) =>
            call("POST", `/templates/${templateId}/run`, {
              body: {
                ...(name !== undefined ? { name } : {}),
                ...(isUrgent !== undefined ? { is_urgent: isUrgent } : {}),
                ...(ancestorTaskId !== undefined ? { ancestor_task_id: ancestorTaskId } : {}),
                ...(dueDateTsp !== undefined ? { due_date_tsp: dueDateTsp } : {}),
                ...(kickoff !== undefined ? { kickoff } : {}),
              },
            }),
        ),
        fields: query(
          {
            description:
              "List field values of a template's workflows. status is running, delayed or done; fields is a comma-separated list of field api_names. Paginated (default limit 15).",
            input: object({
              templateId: number(),
              status: string().optional(),
              fields: string().optional(),
              ...paging,
            }),
          },
          async (_ctx, { templateId, status, fields, limit, offset }) =>
            call("GET", "/workflows/fields", {
              params: { template_id: templateId, status, fields, limit, offset },
            }),
        ),
        completeTask: mutation(
          {
            description:
              "Complete the active task of a workflow. taskId must be the workflow's current task (current_task.id of the workflow). userId is optional; output maps task field api_names to values or selection ids.",
            input: object({
              workflowId: number(),
              taskId: number(),
              userId: number().optional(),
              output: record(json()).optional(),
            }),
          },
          async (_ctx, { workflowId, taskId, userId, output }) =>
            call("POST", `/workflows/${workflowId}/task-complete`, {
              body: {
                task_id: taskId,
                ...(userId !== undefined ? { user_id: userId } : {}),
                ...(output !== undefined ? { output } : {}),
              },
            }),
        ),
      },
      { title: "Workflows", description: "Run workflows and read their data." },
    ),
    attachments: router(
      {
        create: mutation(
          {
            description:
              "Register a file attachment (size under 104857600 bytes). Returns {id, file_upload_url, thumbnail_upload_url?}; upload the bytes with PUT to file_upload_url, then publish it. Set thumbnail to true to also get a thumbnail upload URL.",
            input: object({
              filename: string({ minLength: 1 }),
              contentType: string({ minLength: 1 }),
              size: number(),
              thumbnail: boolean().optional(),
            }),
          },
          async (_ctx, { filename, contentType, size, thumbnail }) =>
            call("POST", "/workflows/attachments", {
              body: {
                filename,
                content_type: contentType,
                size,
                ...(thumbnail !== undefined ? { thumbnail } : {}),
              },
            }),
        ),
        publish: mutation(
          {
            description: "Publish an uploaded attachment so it is visible. Returns {url, thumbnail_url}.",
            input: object({ attachmentId: string({ minLength: 1 }) }),
          },
          async (_ctx, { attachmentId }) => call("POST", `/workflows/attachments/${encodeURIComponent(attachmentId)}/publish`),
        ),
      },
      { title: "Attachments", description: "File uploads for kickoff and task fields." },
    ),
    tasks: router(
      {
        list: query(
          {
            description: "List running tasks, optionally only those assigned to a user id (assignedTo). Paginated.",
            input: object({ assignedTo: number().optional(), ...paging }),
          },
          async (_ctx, { assignedTo, limit, offset }) =>
            call("GET", "/v3/tasks", { params: { assigned_to: assignedTo, limit, offset } }),
        ),
        get: query(
          {
            description: "Get one task with its description, dates, performers and output fields.",
            input: object({ taskId: number() }),
          },
          async (_ctx, { taskId }) => call("GET", `/v2/tasks/${taskId}`),
        ),
      },
      { title: "Tasks", description: "Workflow tasks." },
    ),
    users: router(
      {
        list: query(
          {
            description:
              "List account users. ordering is last_name (default), first_name or status (prefix - to reverse); type is guest or user; status is active (default), inactive or invited; groups is a comma-separated list of group ids. Paginated.",
            input: object({
              ordering: string().optional(),
              type: string().optional(),
              status: string().optional(),
              groups: string().optional(),
              ...paging,
            }),
          },
          async (_ctx, { ordering, type, status, groups, limit, offset }) =>
            call("GET", "/accounts/users", { params: { ordering, type, status, groups, limit, offset } }),
        ),
      },
      { title: "Users", description: "Account members." },
    ),
    webhooks: router(
      {
        listEvents: query(
          {
            description: "List webhook events (workflow_completed, workflow_started, task_completed_v2, task_returned) with their subscribed URL or null.",
            input: object({}),
          },
          async () => call("GET", "/webhooks/events"),
        ),
        getEvent: query(
          {
            description: "Get the subscribed URL of one webhook event.",
            input: object({ event: string({ minLength: 1 }) }),
          },
          async (_ctx, { event }) => call("GET", `/webhooks/events/${encodeURIComponent(event)}`),
        ),
        subscribeEvent: mutation(
          {
            description: "Subscribe a URL to one webhook event, replacing any existing subscription.",
            input: object({ event: string({ minLength: 1 }), url: string({ minLength: 1 }) }),
          },
          async (_ctx, { event, url }) => call("POST", `/webhooks/events/${encodeURIComponent(event)}/subscribe`, { body: { url } }),
        ),
        unsubscribeEvent: mutation(
          {
            description: "Remove the subscription of one webhook event.",
            input: object({ event: string({ minLength: 1 }) }),
          },
          async (_ctx, { event }) => call("POST", `/webhooks/events/${encodeURIComponent(event)}/unsubscribe`),
        ),
        subscribeAll: mutation(
          {
            description:
              "Subscribe one URL to all webhook events at once. The vendor docs show no request body; returns {url}, the subscription URL set for all events.",
            input: object({}),
          },
          async () => call("POST", "/webhooks/subscribe"),
        ),
        unsubscribeAll: mutation(
          {
            description: "Clear the URLs of all webhook events.",
            input: object({}),
          },
          async () => call("POST", "/webhooks/unsubscribe"),
        ),
      },
      { title: "Webhooks", description: "Event subscriptions." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { pneumatic: pneumatic.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pneumatic ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pneumatic",
        description: "Run and manage workflows in Pneumatic: templates, workflow runs, tasks, users, attachments and webhooks.",
        icons,
      },
    ),
  }),
);
