import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const description =
  "OpenRouter: unified access to hundreds of LLMs with chat completions, responses, messages, embeddings, images, rerank, models, credits, API keys and guardrails.";

const openrouter = defineProvider({
  name: "OpenRouter",
  hosts: ["openrouter.ai"],
  auth: {
    // Regular keys call inference routes. Management keys administer account routes (keys,
    // guardrails, analytics, workspaces) and cannot call completion endpoints.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://openrouter.ai/api/v1/key", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

const post = async (
  fetch: typeof globalThis.fetch,
  signal: AbortSignal,
  token: string,
  path: string,
  body: unknown,
) =>
  decodeJson(
    await fetch(`https://openrouter.ai/api/v1${path}`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
    json(),
  );

const params = json().optional();

// The spec marks these inference operations as text/event-stream, so the generator drops
// them. These tools call the same routes with stream=false (or no stream field), which
// returns plain JSON. `params` carries any further documented body fields.
const inference = (account: { fields: { token: string } }, signal: AbortSignal) => {
  const call = (path: string, force: Record<string, unknown>) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }, input: { params?: unknown } & Record<string, unknown>) => {
      const { params: extra, ...rest } = input;
      const body = { ...(typeof extra === "object" && extra !== null ? extra : {}), ...rest, ...force };
      return post(fetch, signal, account.fields.token, path, body);
    };
  return router({
    chatCompletions: mutation(
      {
        description:
          "Create a chat completion (non-streaming). POST /chat/completions. Pass `model`, `messages` and any other documented body fields in `params`.",
        input: object({ messages: json(), model: string().optional(), params }),
        approval: always(),
      },
      call("/chat/completions", { stream: false }),
    ),
    responses: mutation(
      {
        description:
          "Create a response with the Responses API (non-streaming). POST /responses. Pass `model`, `input` and other documented fields in `params`.",
        input: object({ model: string().optional(), input: json().optional(), params }),
        approval: always(),
      },
      call("/responses", { stream: false }),
    ),
    messages: mutation(
      {
        description:
          "Create an Anthropic-style message (non-streaming). POST /messages. Pass `max_tokens` and other documented fields in `params`.",
        input: object({ model: string(), messages: json(), params }),
        approval: always(),
      },
      call("/messages", { stream: false }),
    ),
    embeddings: mutation(
      {
        description: "Create embeddings. POST /embeddings.",
        input: object({ model: string(), input: json(), params }),
        approval: always(),
      },
      call("/embeddings", {}),
    ),
    images: mutation(
      {
        description: "Generate images (non-streaming). POST /images.",
        input: object({ model: string(), prompt: string(), params }),
        approval: always(),
      },
      call("/images", { stream: false }),
    ),
    rerank: mutation(
      {
        description: "Rerank documents against a query. POST /rerank.",
        input: object({ model: string(), query: string(), documents: json(), params }),
        approval: always(),
      },
      call("/rerank", {}),
    ),
  });
};

export default defineApp(
  { user: { accounts: { openrouter: openrouter.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.openrouter ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        inference: await accountRouter(user?.accounts.openrouter ?? [], (account) => inference(account, signal), { signal }),
      },
      { title: "OpenRouter", description, icons },
    ),
  }),
);
