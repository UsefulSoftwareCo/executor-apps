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

const dify = defineProvider({
  name: "Dify",
  hosts: ["api.dify.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Keys are scoped to one app or one knowledge base: /info answers app keys and /datasets
  // answers knowledge-base keys. The key is rejected only when both endpoints answer 401.
  async health({ account, fetch, signal }) {
    const headers = { Authorization: `Bearer ${account.fields.token}` };
    const app = await fetch("https://api.dify.ai/v1/info", { signal, headers });
    if (app.status !== 401) return;
    const dataset = await fetch("https://api.dify.ai/v1/datasets?limit=1", { signal, headers });
    if (dataset.status === 401) throw new Error("Dify rejected the API key");
  },
});

export default defineApp(
  { user: { accounts: { dify: dify.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dify ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Dify",
        description:
          "Run Dify apps and manage knowledge bases: chat, completion and workflow runs, conversations, annotations, datasets and documents.",
        icons,
      },
    ),
  }),
);
