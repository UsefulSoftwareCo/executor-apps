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
  boolean,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.thesys.dev/v1";

type Account = { fields: { token: string } };

const openui = defineProvider({
  name: "OpenUI Cloud",
  hosts: ["api.thesys.dev"],
  auth: {
    // Thesys has no OAuth for developers: keys come from console.thesys.dev/keys.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/conversations?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  async function call(method: string, path: string, body?: unknown) {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  }
  const q = (params: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value));
    const text = search.toString();
    return text ? `?${text}` : "";
  };
  const id = (value: string) => encodeURIComponent(value);

  const Page = { limit: number().optional(), order: string().optional() };
  const Conv = { conversation_id: string({ minLength: 1 }) };

  return router({
    chat: router(
      {
        complete: mutation(
          {
            description:
              "Create a chat completion through the Gateway (OpenAI Chat Completions format, POST /v1/embed/chat/completions). Put an OpenUI system prompt in the system message to get OpenUI Lang back. Non-streaming. Tool calls are returned, not executed.",
            input: object({
              model: string({ minLength: 1 }),
              messages: array(json()),
              tools: array(json()).optional(),
              tool_choice: json().optional(),
              temperature: number().optional(),
              top_p: number().optional(),
              max_tokens: number().optional(),
              stop: json().optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/embed/chat/completions", { ...input, stream: false }),
        ),
      },
      { title: "Chat completions", description: "OpenAI-compatible chat completions that generate UI." },
    ),
    responses: router(
      {
        create: mutation(
          {
            description:
              "Create a response through the Gateway (OpenAI Responses format, POST /v1/embed/responses). Supports conversation, previous_response_id, store and tools (function, web_search, image_search, mcp). Non-streaming.",
            input: object({
              model: string({ minLength: 1 }),
              input: json(),
              instructions: string().optional(),
              conversation: json().optional(),
              previous_response_id: string().optional(),
              store: boolean().optional(),
              tools: array(json()).optional(),
              tool_choice: json().optional(),
              temperature: number().optional(),
              max_output_tokens: number().optional(),
            }),
          },
          async (_ctx, input) => call("POST", "/embed/responses", { ...input, stream: false }),
        ),
      },
      { title: "Responses", description: "Open Responses compatible generation with persistent conversations and hosted tools." },
    ),
    conversations: router(
      {
        list: query(
          { description: "List conversations.", input: object(Page) },
          async (_ctx, input) => call("GET", `/conversations${q(input)}`),
        ),
        create: mutation(
          { description: "Create a conversation.", input: object({ metadata: json().optional() }) },
          async (_ctx, input) => call("POST", "/conversations", input),
        ),
        get: query(
          { description: "Retrieve a conversation.", input: object(Conv) },
          async (_ctx, { conversation_id }) => call("GET", `/conversations/${id(conversation_id)}`),
        ),
        update: mutation(
          {
            description: "Update a conversation (its metadata).",
            input: object({ ...Conv, metadata: json().optional() }),
          },
          async (_ctx, { conversation_id, ...body }) => call("POST", `/conversations/${id(conversation_id)}`, body),
        ),
        delete: mutation(
          { description: "Delete a conversation.", input: object(Conv) },
          async (_ctx, { conversation_id }) => call("DELETE", `/conversations/${id(conversation_id)}`),
        ),
        items: router({
          list: query(
            { description: "List items in a conversation.", input: object({ ...Conv, ...Page }) },
            async (_ctx, { conversation_id, ...rest }) => call("GET", `/conversations/${id(conversation_id)}/items${q(rest)}`),
          ),
          add: mutation(
            {
              description: "Add items (for example messages) to a conversation, in the Responses item format.",
              input: object({ ...Conv, items: array(json()) }),
            },
            async (_ctx, { conversation_id, ...body }) => call("POST", `/conversations/${id(conversation_id)}/items`, body),
          ),
          get: query(
            { description: "Retrieve one conversation item.", input: object({ ...Conv, item_id: string({ minLength: 1 }) }) },
            async (_ctx, { conversation_id, item_id }) => call("GET", `/conversations/${id(conversation_id)}/items/${id(item_id)}`),
          ),
          delete: mutation(
            { description: "Delete one conversation item.", input: object({ ...Conv, item_id: string({ minLength: 1 }) }) },
            async (_ctx, { conversation_id, item_id }) => call("DELETE", `/conversations/${id(conversation_id)}/items/${id(item_id)}`),
          ),
        }),
      },
      { title: "Conversations", description: "Persistent conversations used with the Responses API." },
    ),
    frontendTokens: router(
      {
        create: mutation(
          {
            description:
              "Mint a short-lived frontend token for a user (POST /v1/frontend-tokens). It only authorizes Conversations endpoints and is meant for browsers. Returns token and expires_at.",
            input: object({ user_id: string({ minLength: 1 }) }),
          },
          async (_ctx, input) => call("POST", "/frontend-tokens", input),
        ),
      },
      { title: "Frontend tokens", description: "Scoped browser tokens." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { openui: openui.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.openui ?? [],
        (account) =>
          withApprovals(build(account as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "OpenUI Cloud",
        description:
          "OpenUI Cloud (Thesys) Gateway: generate interactive UI via OpenAI-compatible chat completions and Responses, and manage persistent conversations and frontend tokens.",
        icons,
      },
    ),
  }),
);
