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
import { aiOptions, analyticsOptions, cuecardsOptions, options } from "./openapi.js";

const cloudtalk = defineProvider({
  name: "CloudTalk",
  hosts: ["my.cloudtalk.io", "analytics-api.cloudtalk.io", "api.cloudtalk.io", "platform-api.cloudtalk.io"],
  auth: {
    apiKey: secrets({
      label: "API access key",
      fields: object({
        accessKeyId: plain(string({ minLength: 1 })),
        accessKeySecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://my.cloudtalk.io/api/agents/index.json?limit=1", {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.accessKeyId}:${account.fields.accessKeySecret}`)}`,
      },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { cloudtalk: cloudtalk.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cloudtalk ?? [],
        (account) => {
          const mount = (o: Parameters<typeof liveOpenapiRouter>[0] extends infer P ? Omit<P, "cache" | "fetch" | "signal" | "account"> : never) =>
            withApprovals(liveOpenapiRouter({ ...o, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              api: mount(options),
              analytics: mount(analyticsOptions),
              cuecards: mount(cuecardsOptions),
              ai: mount(aiOptions),
            },
            { title: "CloudTalk", description: "CloudTalk account." },
          );
        },
        { signal },
      ),
      {
        title: "CloudTalk",
        description:
          "CloudTalk call center. api: calls, contacts, agents, groups, campaigns, numbers, SMS, tags, notes, activities, blacklist. analytics: detailed call flow. cuecards: real-time agent guidance. ai: Conversation Intelligence, VoiceAgents, knowledge bases and the Dialer.",
        icons,
      },
    ),
  }),
);
