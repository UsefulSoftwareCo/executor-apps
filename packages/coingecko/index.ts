import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  array,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { demoOptions, options } from "./openapi.js";

const pro = defineProvider({
  name: "CoinGecko Pro",
  hosts: ["pro-api.coingecko.com"],
  auth: {
    apiKey: secrets({
      label: "Pro API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://pro-api.coingecko.com/api/v3/key", {
      signal,
      headers: { "x-cg-pro-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

const demo = defineProvider({
  name: "CoinGecko Demo",
  hosts: ["api.coingecko.com"],
  auth: {
    apiKey: secrets({
      label: "Demo API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // /key is Pro-only; this endpoint is in the demo spec and rejects invalid keys (/ping does not).
    const response = await fetch("https://api.coingecko.com/api/v3/simple/supported_vs_currencies", {
      signal,
      headers: { "x-cg-demo-api-key": account.fields.token },
    });
    await decodeJson(response, array(string()));
  },
});

export default defineApp(
  { user: { accounts: { pro: pro.many(), demo: demo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        pro: await accountRouter(
          user?.accounts.pro ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
        demo: await accountRouter(
          user?.accounts.demo ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...demoOptions, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
      },
      {
        title: "CoinGecko",
        description:
          "Crypto market data from CoinGecko: coin prices, markets, history, exchanges, derivatives, NFTs, categories and onchain DEX data. Connect a Pro key under pro, or a free Demo key under demo.",
        icons,
      },
    ),
  }),
);
