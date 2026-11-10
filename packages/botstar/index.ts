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

const botstar = defineProvider({
  name: "BotStar",
  hosts: ["apis.botstar.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://apis.botstar.com/v1/bots/", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`BotStar returned ${response.status}`);
    await response.arrayBuffer();
  },
});

export default defineApp(
  { user: { accounts: { botstar: botstar.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.botstar ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "BotStar",
        description: "Manage BotStar chatbots: bots, bot attributes, publishing, user attributes, CMS entities and items, and sending messages.",
        icons,
      },
    ),
  }),
);
