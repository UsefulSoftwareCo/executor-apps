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

const quo = defineProvider({
  name: "Quo",
  hosts: ["api.quo.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Quo sends the raw key in the Authorization header, with no Bearer prefix.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.quo.com/phone-numbers", {
      signal,
      headers: { Authorization: account.fields.token, "Quo-Api-Version": "2026-03-30" },
    });
    if (!response.ok) throw new Error(`Quo rejected the API key (${response.status})`);
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { quo: quo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.quo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Quo",
        description:
          "Quo (formerly OpenPhone) business phone: calls, messages, contacts, conversations, tasks, users, phone numbers and webhooks.",
        icons,
      },
    ),
  }),
);
