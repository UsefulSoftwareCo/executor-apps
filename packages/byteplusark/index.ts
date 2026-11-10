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
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://ark.ap-southeast.bytepluses.com/api/v3";

const ark = defineProvider({
  name: "BytePlus Ark",
  hosts: ["ark.ap-southeast.bytepluses.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing video tasks is read-only and authenticated. Only 401/403 mean a bad key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/contents/generations/tasks?page_size=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`BytePlus Ark rejected the API key (${response.status})`);
    }
  },
});

type Fetch = typeof fetch;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: string, path: string, body?: Record<string, unknown>) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

const drop = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));

function build(call: ReturnType<typeof client>) {
  return router({
    video: router(
      {
        create: mutation(
          {
            description:
              "Start a potentially billable asynchronous video generation task and return its task id. model is a video model id (for example a Seedance model) or an inference endpoint id available in the account's region. content is one to five ordered inputs: {type:'text', text}, {type:'image_url', image_url:{url}, role?}, and for models that support them video/audio inputs. Supported combinations depend on the model. Poll with video.get until status is succeeded, then read content.video_url. frames (25+4n, 29 to 289) takes precedence over duration. A callback_url receives status POSTs.",
            input: object({
              model: string({ minLength: 1 }),
              content: array(record(json())),
              resolution: string().optional(),
              ratio: string().optional(),
              duration: number().optional(),
              frames: number().optional(),
              seed: number().optional(),
              camera_fixed: boolean().optional(),
              watermark: boolean().optional(),
              generate_audio: boolean().optional(),
              draft: boolean().optional(),
              return_last_frame: boolean().optional(),
              service_tier: string().optional(),
              execution_expires_after: number().optional(),
              callback_url: string().optional(),
              safety_identifier: string().optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/contents/generations/tasks", drop(input)),
        ),
        get: query(
          {
            description: "Retrieve one video generation task's status, failure details and output URLs by task id.",
            input: object({ taskId: string({ minLength: 1 }) }),
          },
          async (_ctx, { taskId }) => call("GET", `/contents/generations/tasks/${encodeURIComponent(taskId)}`),
        ),
        list: query(
          {
            description:
              "List one page of video generation tasks, optionally filtered by status (queued, running, cancelled, succeeded, failed), model (inference endpoint id), service tier (default or flex) or task ids.",
            input: object({
              pageNum: number().optional(),
              pageSize: number().optional(),
              status: string().optional(),
              model: string().optional(),
              serviceTier: string().optional(),
              taskIds: array(string({ minLength: 1 })).optional(),
            }),
          },
          async (_ctx, { pageNum, pageSize, status, model, serviceTier, taskIds }) => {
            const params = new URLSearchParams();
            if (pageNum !== undefined) params.set("page_num", String(pageNum));
            if (pageSize !== undefined) params.set("page_size", String(pageSize));
            if (status !== undefined) params.set("filter.status", status);
            if (model !== undefined) params.set("filter.model", model);
            if (serviceTier !== undefined) params.set("filter.service_tier", serviceTier);
            for (const id of taskIds ?? []) params.append("filter.task_ids", id);
            const qs = params.toString();
            return call("GET", `/contents/generations/tasks${qs ? `?${qs}` : ""}`);
          },
        ),
        cancelOrDelete: mutation(
          {
            description:
              "Irreversibly cancel a queued video task, or permanently delete the record of a task in a terminal state. The service picks which from the task's current status; check it with video.get first.",
            input: object({ taskId: string({ minLength: 1 }) }),
          },
          async (_ctx, { taskId }) => call("DELETE", `/contents/generations/tasks/${encodeURIComponent(taskId)}`),
        ),
      },
      { title: "Video generation", description: "Asynchronous video generation tasks." },
    ),
    chat: mutation(
      {
        description:
          "Create a chat completion (OpenAI-compatible POST /chat/completions). model is a model id or endpoint id. messages is the OpenAI-style message array. extra holds any other request fields (temperature, max_tokens, tools, thinking, response_format...). Billable. Streaming is not supported.",
        input: object({
          model: string({ minLength: 1 }),
          messages: array(record(json())),
          extra: record(json()).optional(),
        }),
      },
      async (_ctx, { model, messages, extra }) =>
        call("POST", "/chat/completions", { ...(extra ?? {}), model, messages, stream: false }),
    ),
    images: mutation(
      {
        description:
          "Generate images from a text prompt (POST /images/generations) with a Seedream model or endpoint id. extra holds other request fields (size, response_format, image, watermark, seed, sequential_image_generation...). Billable.",
        input: object({
          model: string({ minLength: 1 }),
          prompt: string({ minLength: 1 }),
          extra: record(json()).optional(),
        }),
      },
      async (_ctx, { model, prompt, extra }) =>
        call("POST", "/images/generations", { ...(extra ?? {}), model, prompt }),
    ),
    embeddings: mutation(
      {
        description:
          "Create text embeddings (POST /embeddings) with an embedding model or endpoint id. input is a string or an array of strings. Billable.",
        input: object({ model: string({ minLength: 1 }), input: json(), extra: record(json()).optional() }),
      },
      async (_ctx, { model, input, extra }) => call("POST", "/embeddings", { ...(extra ?? {}), model, input }),
    ),
  });
}

export default defineApp(
  { user: { accounts: { ark: ark.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ark ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "BytePlus Ark",
        description:
          "BytePlus ModelArk generative AI APIs: Seedance video generation tasks, chat completions, Seedream image generation and embeddings.",
        icons,
      },
    ),
  }),
);
