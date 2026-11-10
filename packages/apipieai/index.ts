import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { liveOpenapiRouter } from "apps/openapi";
import { options } from "./openapi.js";

const base = "https://apipie.ai";

const apipie = defineProvider({
  name: "APIpie AI",
  hosts: ["apipie.ai"],
  auth: {
    // Created under Profile > API Keys at https://apipie.ai/profile/api-keys.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/queries/?limit=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { apipie: apipie.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.apipie ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (t) =>
            t.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "APIpie AI",
        description:
          "APIpie AI model aggregator: chat completions, embeddings, images, speech, web search and scrape, real-estate and job data, model catalog, usage history, vector collections, RAG tuning and state settings.",
        icons,
      },
    ),
  }),
);
