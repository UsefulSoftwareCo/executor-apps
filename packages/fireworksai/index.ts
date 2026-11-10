import {
  accountRouter,
  decodeJson,
  defineApp,
  array,
  defineProvider,
  json,
  mutation,
  object,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const fireworks = defineProvider({
  name: "Fireworks AI",
  hosts: ["api.fireworks.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.fireworks.ai/v1/accounts?pageSize=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

type Fetch = typeof fetch;

// The framework drops OpenAPI operations whose 200 response declares text/event-stream, which removes
// the two main inference endpoints. These tools call them directly with streaming forced off.
function inference(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = (path: string) => async (_ctx: unknown, args: { model: string; body?: Record<string, unknown> }) => {
    const { body, ...required } = args;
    const response = await fetcher(`https://api.fireworks.ai/inference${path}`, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, ...required, stream: false }),
    });
    return decodeJson(response, json());
  };
  const extra = record(json()).optional();
  return router({
    createChatCompletion: mutation(
      {
        description:
          "Create a chat completion (POST /v1/chat/completions). Streaming is always disabled; the full JSON response is returned. Pass further request fields (temperature, max_tokens, tools, ...) in body.",
        input: object({ model: string(), messages: array(json()), body: extra }),
      },
      call("/v1/chat/completions"),
    ),
    createCompletion: mutation(
      {
        description:
          "Create a text completion (POST /v1/completions). Streaming is always disabled; the full JSON response is returned. Pass further request fields (max_tokens, temperature, ...) in body.",
        input: object({ model: string(), prompt: json(), body: extra }),
      },
      call("/v1/completions"),
    ),
  });
}

export default defineApp(
  { user: { accounts: { fireworks: fireworks.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fireworks ?? [],
        (account) =>
          withApprovals(
            router({
              inference: inference(account.fields.token, fetch, signal),
              api: liveOpenapiRouter({ ...options, cache, fetch, signal, account }),
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Fireworks AI",
        description:
          "Fireworks AI: inference (chat, completions, embeddings, responses), models, deployments, datasets, fine-tuning and account management.",
        icons,
      },
    ),
  }),
);
