import {
  accountRouter,
  decodeJson,
  defineApp,
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

const base = "https://api.writer.com";

// The spec declares text/event-stream responses for these four operations, so the
// OpenAPI router skips them. These tools call the same endpoints with stream:false.
function generation(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const post = async (path: string, body: Record<string, unknown>) =>
    decodeJson(
      await fetcher(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, stream: false }),
      }),
      json(),
    );
  return router(
    {
      chat: mutation(
        {
          description:
            "POST /v1/chat: chat completion with a Palmyra model. Pass the request as body, for example {model: 'palmyra-x5', messages: [{role: 'user', content: '...'}]}. Responses are never streamed.",
          input: object({ body: record(json()) }),
        },
        async (_ctx, { body }) => post("/v1/chat", body),
      ),
      completions: mutation(
        {
          description:
            "POST /v1/completions: text completion. Pass the request as body, for example {model: 'palmyra-x5', prompt: '...', max_tokens: 150}. Responses are never streamed.",
          input: object({ body: record(json()) }),
        },
        async (_ctx, { body }) => post("/v1/completions", body),
      ),
      askGraph: mutation(
        {
          description:
            "POST /v1/graphs/question: answer a question from Knowledge Graphs. Pass body {graph_ids: [...], question: '...'} plus optional subqueries and query_config. Responses are never streamed.",
          input: object({ body: record(json()) }),
        },
        async (_ctx, { body }) => post("/v1/graphs/question", body),
      ),
      generateFromApplication: mutation(
        {
          description:
            "POST /v1/applications/{application_id}: generate content from a no-code agent. Pass body {inputs: [{id, value: [...]}]}. Responses are never streamed.",
          input: object({ application_id: string({ minLength: 1 }), body: record(json()) }),
        },
        async (_ctx, { application_id, body }) =>
          post(`/v1/applications/${encodeURIComponent(application_id)}`, body),
      ),
    },
    { title: "Generation", description: "Chat, text completion, Knowledge Graph question and no-code agent generation (non-streaming)." },
  );
}

const writer = defineProvider({
  name: "Writer",
  hosts: ["api.writer.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.writer.com/v1/models", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { writer: writer.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.writer ?? [],
        (account) =>
          withApprovals(
            router({
              api: liveOpenapiRouter({ ...options, cache, fetch, signal, account }),
              text: generation(account.fields.token, fetch, signal),
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Writer",
        description:
          "Writer AI platform: chat and text completions with Palmyra models, Knowledge Graphs, files, applications, web search, PDF parsing and vision.",
        icons,
      },
    ),
  }),
);
