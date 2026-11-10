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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const exa = defineProvider({
  name: "Exa",
  hosts: ["api.exa.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /v0/teams/me is a read-only account endpoint; only the response status is checked.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.exa.ai/v0/teams/me", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    if (!response.ok) throw new Error(`Exa rejected the API key (${response.status})`);
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
    await fetch(`https://api.exa.ai${path}`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", "x-api-key": token },
      body: JSON.stringify(body),
    }),
    json(),
  );

const UserLocation = string().optional();

// The spec marks POST /search and POST /answer as server-sent-event responses, so the
// generator drops them. These tools call them with stream=false, which returns plain JSON.
const exaCustom = (account: { fields: { token: string } }, signal: AbortSignal) =>
  router({
    search: mutation(
      {
        description:
          "Search the web with Exa. Returns results with title, url, published date and optional page contents. Set `type` to auto, fast, instant, deep-lite, deep or deep-reasoning.",
        input: object({
          query: string(),
          type: string().optional(),
          category: string().optional(),
          numResults: number().optional(),
          includeDomains: array(string()).optional(),
          excludeDomains: array(string()).optional(),
          startPublishedDate: string().optional(),
          endPublishedDate: string().optional(),
          userLocation: UserLocation,
          contents: json().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        post(fetch, signal, account.fields.token, "/search", { ...input, stream: false }),
    ),
    answer: mutation(
      {
        description:
          "Get an answer to a question grounded in a web search, with citations. Returns the answer and the cited sources.",
        input: object({
          query: string(),
          text: json().optional(),
          model: string().optional(),
          systemPrompt: string().optional(),
          outputSchema: json().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        post(fetch, signal, account.fields.token, "/answer", { ...input, stream: false }),
    ),
  });

export default defineApp(
  { user: { accounts: { exa: exa.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        api: await accountRouter(
          user?.accounts.exa ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        custom: await accountRouter(user?.accounts.exa ?? [], (account) => exaCustom(account, signal), { signal }),
      },
      {
        title: "Exa",
        description: "AI web search with Exa: search, find similar pages, fetch page contents, get cited answers, and manage monitors, agent runs, batches and websets.",
        icons,
      },
    ),
  }),
);
