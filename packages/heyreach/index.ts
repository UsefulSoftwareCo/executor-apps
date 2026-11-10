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

const heyreach = defineProvider({
  name: "HeyReach",
  hosts: ["api.heyreach.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // CheckApiKey returns 200 with an empty body for a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.heyreach.io/api/public/auth/CheckApiKey", {
      signal,
      headers: { "X-API-KEY": account.fields.token },
    });
    if (!response.ok) throw new Error(`HeyReach rejected the API key (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { heyreach: heyreach.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.heyreach ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "HeyReach",
        description: "Automate LinkedIn outreach with HeyReach: campaigns, lead lists, leads, LinkedIn accounts, inbox conversations, analytics, blacklists and webhooks.",
        icons,
      },
    ),
  }),
);
