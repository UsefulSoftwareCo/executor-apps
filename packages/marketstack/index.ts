import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
} from "apps";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const marketstack = defineProvider({
  name: "Marketstack",
  hosts: ["api.marketstack.com"],
  auth: {
    // Marketstack authenticates only with the access_key query parameter.
    apiKey: secrets({
      label: "API access key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Marketstack has no account endpoint; the currencies list is a cheap read-only call.
  // Errors arrive as 2xx-or-4xx {success:false,error}; requiring `data` rejects that envelope.
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.marketstack.com/v2/currencies");
    url.searchParams.set("limit", "1");
    url.searchParams.set("access_key", account.fields.token);
    await decodeJson(await fetch(url.toString(), { signal }), object({ data: array(object({})) }));
  },
});

export default defineApp(
  { user: { accounts: { marketstack: marketstack.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.marketstack ?? [],
        (account) => liveOpenapiRouter({ ...options, cache, fetch, signal, account }),
        { signal },
      ),
      {
        title: "Marketstack",
        description:
          "Stock market data from Marketstack: end-of-day, intraday and historical prices, tickers, exchanges, splits, dividends, indices, ETFs, bonds, commodities, currencies, timezones and company data.",
        icons,
      },
    ),
  }),
);
