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

const junglescout = defineProvider({
  name: "Jungle Scout",
  hosts: ["developer.junglescout.com"],
  auth: {
    apiKey: secrets({
      label: "API key (KEY_NAME:API_KEY)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Every endpoint needs query parameters and consumes quota, so call one without them: a bad
  // key is answered 401/403, a good key gets a validation error.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://developer.junglescout.com/api/sales_estimates_query", {
      signal,
      headers: {
        Authorization: account.fields.token,
        "X-API-Type": "junglescout",
        Accept: "application/vnd.junglescout.v1+json",
      },
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Jungle Scout rejected the API key (${response.status})`);
    }
  },
});

export default defineApp(
  { user: { accounts: { junglescout: junglescout.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.junglescout ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              signal,
              account,
              fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("X-API-Type", "junglescout");
                headers.set("Accept", "application/vnd.junglescout.v1+json");
                return fetch(input, { ...init, headers });
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Jungle Scout",
        description:
          "Amazon seller research: keyword search volume and history, product database queries, sales estimates and share of voice.",
        instructions:
          "Every call needs a marketplace (us, uk, de, ca, fr, it, es, mx, jp, in). The product database and keyword queries are POST requests but only read data.",
        icons,
      },
    ),
  }),
);
