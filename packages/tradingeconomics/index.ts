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

const tradingeconomics = defineProvider({
  name: "Trading Economics",
  hosts: ["api.tradingeconomics.com"],
  auth: {
    apiKey: secrets({
      label: "API client key (key:secret)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.tradingeconomics.com/country/mexico?f=json", {
      signal,
      headers: { Authorization: `Client ${account.fields.token}` },
    });
    if (!response.ok) throw new Error(`Trading Economics returned ${response.status}`);
    await response.arrayBuffer();
  },
});

export default defineApp(
  { user: { accounts: { tradingeconomics: tradingeconomics.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tradingeconomics ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Trading Economics",
        description: "Economic indicators, forecasts, calendar, markets, currencies, commodities, bonds and news for 196 countries.",
        icons,
      },
    ),
  }),
);
