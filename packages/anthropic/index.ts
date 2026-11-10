import {
  accountRouter,
  array,
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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.anthropic.com";
const filesBeta = "files-api-2025-04-14";

const anthropic = defineProvider({
  name: "Anthropic",
  hosts: ["api.anthropic.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/models?limit=1`, { signal, headers: headers(account.fields.token) });
    await decodeJson(response, object({}));
  },
});

function headers(token: string, beta?: string): Record<string, string> {
  return {
    "x-api-key": token,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
    ...(beta ? { "anthropic-beta": beta } : {}),
  };
}

type Query = Record<string, string | number | undefined>;
type Options = { query?: Query; body?: Record<string, unknown>; beta?: string; text?: boolean };

function client(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  return async (method: "GET" | "POST" | "DELETE", path: string, options: Options = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query ?? {})) if (value !== undefined) params.set(key, String(value));
    const qs = params.toString();
    const body = options.body
      ? JSON.stringify(Object.fromEntries(Object.entries(options.body).filter(([, v]) => v !== undefined)))
      : undefined;
    const response = await fetcher(`${base}${path}${qs ? `?${qs}` : ""}`, {
      method,
      signal,
      headers: headers(token, options.beta),
      body,
    });
    if (options.text) {
      const text = await response.text();
      if (!response.ok) throw new Error(`Anthropic API ${response.status}: ${text}`);
      return text;
    }
    return decodeJson(response, json());
  };
}

const page = {
  limit: number().optional(),
  after_id: string().optional(),
  before_id: string().optional(),
};

const id = (name: string) => object({ [name]: string({ minLength: 1 }) });

function build(call: ReturnType<typeof client>) {
  const pageQuery = (i: { limit?: number; after_id?: string; before_id?: string }) => ({
    limit: i.limit,
    after_id: i.after_id,
    before_id: i.before_id,
  });
  const messageFields = {
    model: string({ minLength: 1 }),
    messages: array(json()),
    system: json().optional(),
    max_tokens: number(),
    temperature: number().optional(),
    top_p: number().optional(),
    top_k: number().optional(),
    stop_sequences: array(string()).optional(),
    tools: array(json()).optional(),
    tool_choice: json().optional(),
    thinking: json().optional(),
    metadata: json().optional(),
  };
  const messageBody = (i: Record<string, unknown>) => ({ ...i, stream: undefined });

  return router({
    models: router(
      {
        list: query(
          { description: "List available Claude models, most recently released first.", input: object(page) },
          async (_ctx, i) => call("GET", "/v1/models", { query: pageQuery(i) }),
        ),
        get: query(
          { description: "Get a model by id or alias.", input: id("model_id") },
          async (_ctx, { model_id }) => call("GET", `/v1/models/${encodeURIComponent(model_id)}`),
        ),
      },
      { title: "Models", description: "Available Claude models." },
    ),
    messages: router(
      {
        create: mutation(
          {
            description:
              "Send messages to Claude and get a response (non-streaming). messages is an array of {role, content}; max_tokens is required. Billed to the account.",
            input: object(messageFields),
          },
          async (_ctx, i) => call("POST", "/v1/messages", { body: messageBody(i) }),
        ),
        countTokens: query(
          {
            description: "Count the input tokens a Messages request would use, without running the model.",
            input: object({
              model: string({ minLength: 1 }),
              messages: array(json()),
              system: json().optional(),
              tools: array(json()).optional(),
              tool_choice: json().optional(),
              thinking: json().optional(),
            }),
          },
          async (_ctx, i) => call("POST", "/v1/messages/count_tokens", { body: i }),
        ),
      },
      { title: "Messages", description: "Create Claude responses and count tokens." },
    ),
    batches: router(
      {
        list: query(
          { description: "List message batches.", input: object(page) },
          async (_ctx, i) => call("GET", "/v1/messages/batches", { query: pageQuery(i) }),
        ),
        get: query(
          { description: "Get a message batch, including its processing status and request counts.", input: id("batch_id") },
          async (_ctx, { batch_id }) => call("GET", `/v1/messages/batches/${encodeURIComponent(batch_id)}`),
        ),
        results: query(
          {
            description: "Get the results of an ended batch as JSONL text, one result per line keyed by custom_id.",
            input: id("batch_id"),
          },
          async (_ctx, { batch_id }) =>
            call("GET", `/v1/messages/batches/${encodeURIComponent(batch_id)}/results`, { text: true }),
        ),
        create: mutation(
          {
            description:
              "Create a message batch. requests is an array of {custom_id, params} where params is a Messages create body. Billed to the account.",
            input: object({ requests: array(json()) }),
          },
          async (_ctx, { requests }) => call("POST", "/v1/messages/batches", { body: { requests } }),
        ),
        cancel: mutation(
          { description: "Cancel an in-progress message batch.", input: id("batch_id") },
          async (_ctx, { batch_id }) => call("POST", `/v1/messages/batches/${encodeURIComponent(batch_id)}/cancel`),
        ),
        delete: mutation(
          { description: "Delete an ended message batch.", input: id("batch_id") },
          async (_ctx, { batch_id }) => call("DELETE", `/v1/messages/batches/${encodeURIComponent(batch_id)}`),
        ),
      },
      { title: "Message Batches", description: "Asynchronous batches of Messages requests at reduced cost." },
    ),
    files: router(
      {
        list: query(
          { description: "List uploaded files (Files API, beta).", input: object(page) },
          async (_ctx, i) => call("GET", "/v1/files", { query: pageQuery(i), beta: filesBeta }),
        ),
        get: query(
          { description: "Get metadata for an uploaded file.", input: id("file_id") },
          async (_ctx, { file_id }) => call("GET", `/v1/files/${encodeURIComponent(file_id)}`, { beta: filesBeta }),
        ),
        download: query(
          {
            description: "Download the content of a file as text. Only files created by skills or code execution are downloadable.",
            input: id("file_id"),
          },
          async (_ctx, { file_id }) =>
            call("GET", `/v1/files/${encodeURIComponent(file_id)}/content`, { beta: filesBeta, text: true }),
        ),
        delete: mutation(
          { description: "Delete an uploaded file.", input: id("file_id") },
          async (_ctx, { file_id }) => call("DELETE", `/v1/files/${encodeURIComponent(file_id)}`, { beta: filesBeta }),
        ),
      },
      { title: "Files", description: "Files API (beta): list, inspect, download and delete files." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { anthropic: anthropic.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.anthropic ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Anthropic",
        description: "Use the Claude API: Messages, token counting, models, message batches and files.",
        icons,
      },
    ),
  }),
);
