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
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { chatbotsOptions, knowledgeBasesOptions, pipelinesOptions, transformationsOptions } from "./openapi.js";

const vectorshift = defineProvider({
  name: "VectorShift",
  hosts: ["api.vectorshift.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.vectorshift.ai/v1/pipelines", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ status: string() }));
  },
});

export default defineApp(
  { user: { accounts: { vectorshift: vectorshift.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vectorshift ?? [],
        (account) => {
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              pipelines: mount(pipelinesOptions),
              knowledgeBases: mount(knowledgeBasesOptions),
              chatbots: mount(chatbotsOptions),
              transformations: mount(transformationsOptions),
            },
            { title: "VectorShift", description: "VectorShift workspace." },
          );
        },
        { signal },
      ),
      {
        title: "VectorShift",
        description:
          "VectorShift AI automation platform. pipelines: create, list, bulk run, pause, resume and terminate pipelines. knowledgeBases: create, index, query and manage knowledge bases. chatbots: create and manage chatbots, upload files. transformations: create, run and manage code transformations.",
        icons,
      },
    ),
  }),
);
