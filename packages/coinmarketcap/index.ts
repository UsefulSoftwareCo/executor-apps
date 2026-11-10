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

const coinmarketcap = defineProvider({
  name: "CoinMarketCap",
  hosts: ["pro-api.coinmarketcap.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Key info is available on every plan, including Basic.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://pro-api.coinmarketcap.com/v1/key/info", {
      signal,
      headers: { "X-CMC_PRO_API_KEY": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { coinmarketcap: coinmarketcap.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.coinmarketcap ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "CoinMarketCap",
        description: "Cryptocurrency market data from CoinMarketCap: listings, quotes, OHLCV, exchanges, global metrics, DEX data and tools.",
        icons,
      },
    ),
  }),
);
