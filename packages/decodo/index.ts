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
import { publicApiOptions, statisticsOptions } from "./openapi.js";

const decodo = defineProvider({
  name: "Decodo",
  hosts: ["api.decodo.com"],
  auth: {
    apiKey: secrets({
      label: "Public API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.decodo.com/v2/subscriptions", {
      signal,
      headers: { Authorization: account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { decodo: decodo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.decodo ?? [],
        (account) => {
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            { api: mount(publicApiOptions), statistics: mount(statisticsOptions) },
            { title: "Decodo", description: "Decodo account." },
          );
        },
        { signal },
      ),
      {
        title: "Decodo",
        description:
          "Decodo (formerly Smartproxy) residential proxies. api: sub-users, whitelisted IPs, proxy endpoints, subscription. statistics: traffic and target usage.",
        icons,
      },
    ),
  }),
);
