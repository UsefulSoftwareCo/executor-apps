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
import { options } from "./openapi.js";

const pumble = defineProvider({
  name: "Pumble",
  hosts: ["pumble-api-keys.addons.marketplace.cake.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://pumble-api-keys.addons.marketplace.cake.com/myInfo", {
      signal,
      headers: { ApiKey: account.fields.token },
    });
    await decodeJson(response, object({ id: string() }));
  },
});

export default defineApp(
  { user: { accounts: { pumble: pumble.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pumble ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pumble",
        description: "Send and read Pumble messages, replies, DMs, reactions, scheduled messages, channels and users through the Pumble API Keys addon.",
        icons,
      },
    ),
  }),
);
