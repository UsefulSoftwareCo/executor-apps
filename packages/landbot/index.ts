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
import { aiAgentsOptions, botsOptions, channelsOptions, platformOptions } from "./openapi.js";

const landbot = defineProvider({
  name: "Landbot",
  hosts: ["api.landbot.io"],
  auth: {
    apiKey: secrets({
      label: "Agent token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.landbot.io/v1/channels/", {
      signal,
      headers: { Authorization: `Token ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { landbot: landbot.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.landbot ?? [],
        (account) => {
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              platform: mount(platformOptions),
              bots: mount(botsOptions),
              aiAgents: mount(aiAgentsOptions),
              channels: mount(channelsOptions),
            },
            { title: "Landbot", description: "Landbot workspace." },
          );
        },
        { signal },
      ),
      {
        title: "Landbot",
        description:
          "Landbot chatbots: customers, conversations, channels, WhatsApp templates, webhooks, bots and AI agents.",
        icons,
      },
    ),
  }),
);
