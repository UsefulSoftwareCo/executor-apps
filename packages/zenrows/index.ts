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
import { batchOptions, options } from "./openapi.js";

const zenrows = defineProvider({
  name: "ZenRows",
  hosts: ["api.zenrows.com", "async.api.zenrows.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.zenrows.com/v1/subscriptions/self/details", {
      signal,
      headers: { "X-API-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { zenrows: zenrows.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zenrows ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          return router({
            api: approve(liveOpenapiRouter({ ...options, cache, fetch, signal, account })),
            batch: approve(liveOpenapiRouter({ ...batchOptions, cache, fetch, signal, account })),
          });
        },
        { signal },
      ),
      {
        title: "ZenRows",
        description: "Scrape web pages with ZenRows. api: fetch rendered pages through proxies with anti-bot bypass, auto-extract structured data, plan usage. batch: asynchronous scraping jobs, tasks, results, exports, schedules, webhooks and HMAC keys.",
        icons,
      },
    ),
  }),
);
