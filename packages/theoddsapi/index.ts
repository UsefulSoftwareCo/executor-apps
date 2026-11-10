import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  router,
  secrets,
  string,
} from "apps";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const theoddsapi = defineProvider({
  name: "The Odds API",
  hosts: ["api.the-odds-api.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /v4/sports is free and does not count against the quota. The vendor requires the key in the URL.
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports?apiKey=${encodeURIComponent(account.fields.token)}`,
      { signal },
    );
    await decodeJson(response, json());
  },
});

// Every endpoint is a GET, so there are no mutations to gate with approvals.
export default defineApp(
  { user: { accounts: { theoddsapi: theoddsapi.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.theoddsapi ?? [],
        (account) =>
          liveOpenapiRouter({
            ...options,
            cache,
            fetch,
            signal,
            account,
            parameterDefaults: { query: { apiKey: String(account.fields.token) } },
          }),
        { signal },
      ),
      {
        title: "The Odds API",
        description: "Sports betting odds, scores, events and historical odds from The Odds API.",
        icons,
      },
    ),
  }),
);
