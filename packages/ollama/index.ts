import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  mutation,
  number,
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

const ollama = defineProvider({
  name: "Ollama",
  hosts: ["ollama.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://ollama.com/api/tags", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

// Ollama Cloud's web search and web fetch are documented at
// https://docs.ollama.com/capabilities/web-search but are not in the OpenAPI document.
const post = async (
  fetch: typeof globalThis.fetch,
  signal: AbortSignal,
  token: string,
  path: string,
  body: unknown,
) =>
  fetch(`https://ollama.com${path}`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

const ollamaWeb = (account: { fields: { token: string } }, signal: AbortSignal) =>
  router({
    webSearch: mutation(
      {
        description:
          "Search the web with Ollama Cloud. Returns results with title, url and content. max_results defaults to 5 (maximum 10).",
        input: object({ query: string({ minLength: 1 }), max_results: number().optional() }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await post(fetch, signal, account.fields.token, "/api/web_search", input),
          object({ results: array(object({ title: string(), url: string(), content: string() })) }),
        ),
    ),
    webFetch: mutation(
      {
        description: "Fetch a web page with Ollama Cloud. Returns the page title, content and links.",
        input: object({ url: string({ minLength: 1 }) }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await post(fetch, signal, account.fields.token, "/api/web_fetch", input),
          object({ title: string(), content: string(), links: array(string()) }),
        ),
    ),
  });

export default defineApp(
  { user: { accounts: { ollama: ollama.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.ollama ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        web: await accountRouter(user?.accounts.ollama ?? [], (account) => ollamaWeb(account, signal), { signal }),
      },
      {
        title: "Ollama",
        description: "Run models on Ollama Cloud: chat, generate, embeddings, model listing and details, web search and fetch, plus usage and balance.",
        icons,
      },
    ),
  }),
);
