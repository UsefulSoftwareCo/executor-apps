import {
  accountRouter,
  defineApp,
  defineProvider,
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

// Aryn has no OAuth: API keys are created in the Aryn console.
const aryn = defineProvider({
  name: "Aryn",
  hosts: ["api.aryn.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.aryn.ai/v1/storage/docsets?page_size=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    // The official spec leaves the 200 schema empty and the docs describe a top-level
    // list[DocSetMetadata], so the body shape is not relied on: only the status is checked.
    if (!response.ok) throw new Error(`Aryn rejected the API key (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { aryn: aryn.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.aryn ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Aryn",
        description: "Store and query documents with Aryn: DocSets, documents, async tasks, extraction jobs and natural-language queries.",
        icons,
      },
    ),
  }),
);
