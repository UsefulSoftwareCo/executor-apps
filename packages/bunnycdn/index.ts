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
import { computeOptions, coreOptions, loggingOptions, magicContainersOptions, shieldOptions } from "./openapi.js";

const bunnycdn = defineProvider({
  name: "BunnyCDN",
  hosts: ["api.bunny.net", "logging.bunnycdn.com"],
  auth: {
    apiKey: secrets({
      label: "Account API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.bunny.net/pullzone?page=1&perPage=1", {
      signal,
      headers: { AccessKey: account.fields.apiKey, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { bunnycdn: bunnycdn.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bunnycdn ?? [],
        (account) => {
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              core: mount(coreOptions),
              compute: mount(computeOptions),
              shield: mount(shieldOptions),
              magicContainers: mount(magicContainersOptions),
              logging: mount(loggingOptions),
            },
            { title: "BunnyCDN", description: "bunny.net account." },
          );
        },
        { signal },
      ),
      {
        title: "BunnyCDN",
        description:
          "bunny.net (BunnyCDN). core: pull zones, storage zones, DNS zones, purge, statistics, billing, API keys. compute: Edge Scripting. shield: WAF, rate limits, access lists, DDoS. magicContainers: container apps, registries and deployments. logging: raw CDN request logs (3 days retention).",
        icons,
      },
    ),
  }),
);
