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

const simplero = defineProvider({
  name: "Simplero",
  hosts: ["simplero.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      "https://simplero.com/api/v2/customers?per_page=1",
      {
        signal,
        headers: {
          "X-API-Key": account.fields.token,
          "User-Agent": USER_AGENT,
        },
      },
    );
    await decodeJson(response, object({}));
  },
});

const USER_AGENT = "Executor (support@executor.sh)";

export default defineApp(
  { user: { accounts: { simplero: simplero.many() } }, icons },
  async ({ user, cache, fetch, signal }) => {
    // Simplero rejects requests without a User-Agent (400 "Incorrect User-Agent").
    const simpleroFetch: typeof fetch = (input, init) => {
      const headers = new Headers(
        input instanceof Request ? input.headers : undefined,
      );
      new Headers(init?.headers).forEach((value, key) =>
        headers.set(key, value),
      );
      headers.set("User-Agent", USER_AGENT);
      return fetch(input, { ...init, headers });
    };
    return {
      tools: router(
        await accountRouter(
          user?.accounts.simplero ?? [],
          (account) =>
            withApprovals(
              liveOpenapiRouter({
                ...options,
                cache,
                fetch: simpleroFetch,
                signal,
                account,
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            ),
          { signal },
        ),
        {
          title: "Simplero",
          description:
            "Manage a Simplero business: customers, products, lists, funnels, automations, affiliates, events, assets and more.",
          icons,
        },
      ),
    };
  },
);
