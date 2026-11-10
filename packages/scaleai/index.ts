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

const base = "https://api.scale.com/v1";

// Scale uses HTTP Basic auth with the API key as the username and an empty password.
const authorization = (token: string) => `Basic ${btoa(`${token}:`)}`;

const scale = defineProvider({
  name: "Scale AI",
  hosts: ["api.scale.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing projects is a read-only call that needs a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/projects`, {
      signal,
      headers: { Authorization: authorization(account.fields.token), Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const send = async (method: string, path: string, init: { query?: Record<string, unknown>; body?: unknown } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const headers: Record<string, string> = { Authorization: authorization(token), Accept: "application/json" };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    return decodeJson(response, json());
  };
  return { send };
}

const seg = (value: string) => encodeURIComponent(value);
const name = string({ minLength: 1 });
const taskId = string({ minLength: 1 });

function build({ send }: ReturnType<typeof client>) {
  return router({
    projects: router(
      {
        list: query(
          { description: "List all projects. archived (true or false) filters to archived or unarchived projects; Scale's docs do not specify how this filter is passed, so it is sent as a query parameter and is unverified.", input: object({ archived: boolean().optional() }) },
          async (_ctx, { archived }) => send("GET", "/projects", { query: { archived } }),
        ),
        get: query(
          { description: "Get a project by name.", input: object({ name }) },
          async (_ctx, { name }) => send("GET", `/projects/${seg(name)}`),
        ),
        create: mutation(
          {
            description:
              "Create a project. type is the task type of every task in the project (for example imageannotation, categorization, textcollection). params holds default task parameters; params.instruction is appended after each task's own instruction. rapid and studio are for Scale Rapid and Studio projects only; pipeline (standard_task or consensus_task) and consensus_attempts are for Studio.",
            input: object({
              type: name,
              name,
              rapid: boolean().optional(),
              studio: boolean().optional(),
              params: json().optional(),
              pipeline: string().optional(),
              consensusAttempts: number().optional(),
            }),
            approval: always(),
          },
          async (_ctx, { consensusAttempts, ...rest }) =>
            send("POST", "/projects", { body: { ...rest, consensus_attempts: consensusAttempts } }),
        ),
        setParams: mutation(
          {
            description: "Update a project's default task parameters. params is the new set of default parameters, for example { instruction: '...' }.",
            input: object({ project: name, params: json() }),
            approval: always(),
          },
          async (_ctx, { project, params }) => send("POST", `/projects/${seg(project)}/setParams`, { body: params }),
        ),
      },
      { title: "Projects", description: "Projects group tasks that share a task type, instructions and default parameters." },
    ),
    batches: router(
      {
        list: query(
          {
            description: "List batches. Filter by project, status, start_time and end_time (dates such as 2020-05-21). limit and offset page the results; detailed adds per-batch task counts.",
            input: object({
              project: string().optional(),
              status: string().optional(),
              detailed: boolean().optional(),
              startTime: string().optional(),
              endTime: string().optional(),
              limit: number().optional(),
              offset: number().optional(),
            }),
          },
          async (_ctx, { project, status, detailed, startTime, endTime, limit, offset }) =>
            send("GET", "/batches", {
              query: { project, status, detailed, start_time: startTime, end_time: endTime, limit, offset },
            }),
        ),
        get: query(
          { description: "Get a batch by name.", input: object({ batchName: name }) },
          async (_ctx, { batchName }) => send("GET", `/batches/${seg(batchName)}`),
        ),
        status: query(
          { description: "Get a batch's status with its pending and completed task counts.", input: object({ batchName: name }) },
          async (_ctx, { batchName }) => send("GET", `/batches/${seg(batchName)}/status`),
        ),
        create: mutation(
          {
            description:
              "Create a batch in a project. name must be unique across all batches. callback is a full URL or an email address notified when tasks complete. calibrationBatch and selfLabelBatch apply to Rapid projects only.",
            input: object({
              project: name,
              name,
              callback: string().optional(),
              calibrationBatch: boolean().optional(),
              selfLabelBatch: boolean().optional(),
            }),
            approval: always(),
          },
          async (_ctx, { project, name, callback, calibrationBatch, selfLabelBatch }) =>
            send("POST", "/batches", {
              body: { project, name, callback, calibration_batch: calibrationBatch, self_label_batch: selfLabelBatch },
            }),
        ),
        finalize: mutation(
          {
            description: "Finalize a batch so its tasks can be worked on. Needed for Scale Rapid and Studio only; for other accounts it succeeds and does nothing.",
            input: object({ batchName: name }),
            approval: always(),
          },
          async (_ctx, { batchName }) => send("POST", `/batches/${seg(batchName)}/finalize`),
        ),
        prioritize: mutation(
          {
            description: "Set a batch's priority, an integer from 10 (lowest) to 30 (highest). Only affects tasks that have not started yet.",
            input: object({ batchName: name, priority: number() }),
            approval: always(),
          },
          async (_ctx, { batchName, priority }) => send("POST", `/batches/${seg(batchName)}/prioritize`, { body: { priority } }),
        ),
      },
      { title: "Batches", description: "Batches group tasks within a project and report completion status." },
    ),
    tasks: router(
      {
        list: query(
          {
            description:
              "List tasks, newest first, up to 100 per page. status is completed, pending or canceled. customerReviewStatus values are accepted, fixed, commented or rejected. Time filters take ISO 8601 timestamps. Pass the next_token from the previous response as nextToken to get the next page.",
            input: object({
              project: string().optional(),
              batch: string().optional(),
              type: string().optional(),
              status: array(string()).optional(),
              customerReviewStatus: array(string()).optional(),
              uniqueId: array(string()).optional(),
              tags: array(string()).optional(),
              startTime: string().optional(),
              endTime: string().optional(),
              completedAfter: string().optional(),
              completedBefore: string().optional(),
              updatedAfter: string().optional(),
              updatedBefore: string().optional(),
              includeAttachmentUrl: boolean().optional(),
              limit: number().optional(),
              nextToken: string().optional(),
            }),
          },
          async (_ctx, input) =>
            send("GET", "/tasks", {
              query: {
                project: input.project,
                batch: input.batch,
                type: input.type,
                status: input.status,
                customer_review_status: input.customerReviewStatus,
                unique_id: input.uniqueId,
                tags: input.tags,
                start_time: input.startTime,
                end_time: input.endTime,
                completed_after: input.completedAfter,
                completed_before: input.completedBefore,
                updated_after: input.updatedAfter,
                updated_before: input.updatedBefore,
                include_attachment_url: input.includeAttachmentUrl,
                limit: input.limit,
                next_token: input.nextToken,
              },
            }),
        ),
        get: query(
          { description: "Get a task with its status, parameters and response.", input: object({ taskId }) },
          async (_ctx, { taskId }) => send("GET", `/task/${seg(taskId)}`),
        ),
        create: mutation(
          {
            description:
              "Create a task of any type via POST /task/{taskType}, for example imageannotation, videoannotation, categorization, textcollection, lidarannotation. body is the task's JSON parameters (project, batch, instruction, attachment, callback_url, metadata, unique_id and the type-specific fields); see the task-type reference at https://api-reference.scale.com/docs/api-reference/tasks. Live-mode keys create paid tasks done by humans.",
            input: object({ taskType: name, body: json() }),
            approval: always(),
          },
          async (_ctx, { taskType, body }) => send("POST", `/task/${seg(taskType)}`, { body }),
        ),
        cancel: mutation(
          {
            description: "Cancel a pending task. Set clearUniqueId to also release its unique_id.",
            input: object({ taskId, clearUniqueId: boolean().optional() }),
            approval: always(),
          },
          async (_ctx, { taskId, clearUniqueId }) =>
            send("POST", `/task/${seg(taskId)}/cancel`, { query: { clear_unique_id: clearUniqueId } }),
        ),
        setMetadata: mutation(
          {
            description: "Replace a task's metadata with the given key-value object.",
            input: object({ taskId, metadata: json() }),
            approval: always(),
          },
          async (_ctx, { taskId, metadata }) => send("POST", `/task/${seg(taskId)}/setMetadata`, { body: metadata }),
        ),
        setUniqueId: mutation(
          { description: "Set or change a task's unique_id.", input: object({ taskId, uniqueId: name }), approval: always() },
          async (_ctx, { taskId, uniqueId }) => send("POST", `/task/${seg(taskId)}/unique_id`, { body: { unique_id: uniqueId } }),
        ),
        clearUniqueId: mutation(
          { description: "Remove a task's unique_id.", input: object({ taskId }), approval: always() },
          async (_ctx, { taskId }) => send("DELETE", `/task/${seg(taskId)}/unique_id`),
        ),
        addTags: mutation(
          { description: "Add tags to a task.", input: object({ taskId, tags: array(string({ minLength: 1 })) }), approval: always() },
          async (_ctx, { taskId, tags }) => send("PUT", `/task/${seg(taskId)}/tags`, { body: tags }),
        ),
        removeTags: mutation(
          { description: "Remove tags from a task. Sends the tags as a JSON array body; Scale's reference shows this DELETE without a body, so the shape is unverified.", input: object({ taskId, tags: array(string({ minLength: 1 })) }), approval: always() },
          async (_ctx, { taskId, tags }) => send("DELETE", `/task/${seg(taskId)}/tags`, { body: tags }),
        ),
      },
      { title: "Tasks", description: "Units of labeling work: create, read, cancel and annotate tasks." },
    ),
    teams: router(
      {
        list: query({ description: "List the members of your Scale team with their roles. Undocumented endpoint: GET /teams is not in Scale's public API reference and is unverified.", input: object({}) }, async () => send("GET", "/teams")),
      },
      { title: "Teams", description: "Members of your Scale team." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { scale: scale.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.scale ?? [], (account) => build(client(account.fields.token, fetch, signal)), { signal }),
      {
        title: "Scale AI",
        description: "Scale AI data labeling: manage projects and batches, create and track labeling tasks, and read results.",
        icons,
      },
    ),
  }),
);
