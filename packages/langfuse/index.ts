import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { langfuseOptions, regionHosts, regionOrigin } from "./openapi.js";

const langfuse = defineProvider({
  name: "Langfuse",
  hosts: Object.values(regionHosts),
  auth: {
    apiKey: secrets({
      label: "Project API keys (region: eu, us, jp or hipaa)",
      fields: object({
        region: plain(string({ minLength: 1 })),
        publicKey: string({ minLength: 1 }),
        secretKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${regionOrigin(account.fields.region)}/api/public/projects`, {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.publicKey}:${account.fields.secretKey}`)}`,
        Accept: "application/json",
      },
    });
    await decodeJson(response, object({}));
    return {};
  },
});

export default defineApp(
  { user: { accounts: { langfuse: langfuse.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.langfuse ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({ ...langfuseOptions(account.fields.region), cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Langfuse",
        description: "Langfuse LLM observability: traces, observations, scores, datasets, prompts, sessions, models and annotation queues.",
        icons,
      },
    ),
  }),
);
