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

const botsonic = defineProvider({
  name: "Botsonic",
  hosts: ["api.botsonic.ai"],
  auth: {
    userKey: secrets({
      label: "User API key (manage bots)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    botKey: secrets({
      label: "Bot API key (one bot's data, FAQs and chat)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Each key type is only accepted by its own endpoints, so each probes a read-only listing.
  async health({ account, fetch, signal }) {
    const user = account.method === "userKey";
    const response = await fetch(
      user
        ? "https://api.botsonic.ai/v1/business/bot/all"
        : "https://api.botsonic.ai/v1/business/bot-faq/all?size=1",
      { signal, headers: user ? { "USER-API-KEY": account.fields.token } : { "X-BOT-KEY": account.fields.token } },
    );
    if (!response.ok) throw new Error(`Botsonic rejected the API key (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { botsonic: botsonic.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.botsonic ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || name.includes("getBotApiKey") ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Botsonic",
        description:
          "Manage Botsonic AI chatbots: bots, knowledge base data, FAQs, starter questions, conversations and chat responses.",
        icons,
        instructions:
          "Bot management tools need a User API key account; data, FAQ, starter question, conversation and chat tools need the Bot API key of the bot they act on.",
      },
    ),
  }),
);
