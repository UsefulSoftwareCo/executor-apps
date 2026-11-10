import {
  accountRouter,
  bearer,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { datarobotOptions, siteUrl } from "./openapi.js";

const datarobot = defineProvider({
  name: "DataRobot",
  hosts: ["app.datarobot.com", "app.eu.datarobot.com", "app.jp.datarobot.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        endpoint: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => bearer(token),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.endpoint)}/api/v2/account/rateLimitUsage/`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: new URL(siteUrl(account.fields.endpoint)).hostname } };
  },
});

export default defineApp(
  { user: { accounts: { datarobot: datarobot.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.datarobot ?? [],
        (account) => {
          const signed: typeof fetch = (input, init) => {
            const headers = new Headers(init?.headers);
            for (const [key, value] of Object.entries(account.headers())) headers.set(key, value);
            return fetch(input, { ...init, headers });
          };
          return withApprovals(
            liveOpenapiRouter({ ...datarobotOptions(account.fields.endpoint), cache, fetch: signed, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "DataRobot",
        description:
          "DataRobot machine learning platform: projects, models, datasets, deployments, predictions, monitoring, registry and governance.",
        icons,
      },
    ),
  }),
);
