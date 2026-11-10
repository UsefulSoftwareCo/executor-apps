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

const finnhub = defineProvider({
  name: "Finnhub",
  hosts: ["finnhub.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://finnhub.io/api/v1/stock/market-status?exchange=US", {
      signal,
      headers: { "X-Finnhub-Token": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { finnhub: finnhub.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.finnhub ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Finnhub",
        description: "Finnhub market data: quotes, candles, company profiles and fundamentals, news, earnings, economic data and more.",
        icons,
      },
    ),
  }),
);
