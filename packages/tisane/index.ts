import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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

const tisane = defineProvider({
  name: "Tisane Labs",
  hosts: ["api.tisane.ai"],
  auth: {
    apiKey: secrets({
      label: "Subscription key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing the supported languages is read-only and needs a valid subscription key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.tisane.ai/languages", {
      signal,
      headers: { "Ocp-Apim-Subscription-Key": account.fields.token },
    });
    await decodeJson(response, array(json()));
  },
});

export default defineApp(
  { user: { accounts: { tisane: tisane.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tisane ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Tisane Labs",
        description:
          "Natural language analysis with Tisane: problematic-content detection, sentiment, entities, topics, language detection, semantic similarity, entity comparison, translation and language model lookups.",
        icons,
      },
    ),
  }),
);
