import {
  accountRouter,
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
import { apis } from "./openapi.js";

const benzinga = defineProvider({
  name: "Benzinga",
  hosts: ["api.benzinga.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // A key is entitled per product, so the health check uses the News API, a read-only endpoint.
  async health({ account, fetch, signal }) {
    const url = `https://api.benzinga.com/api/v2/news?pageSize=1&token=${encodeURIComponent(account.fields.token)}`;
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (response.status === 401) throw new Error("Benzinga rejected the API key (401)");
    if (!response.ok) throw new Error(`Benzinga health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { benzinga: benzinga.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.benzinga ?? [],
        (account) =>
          router(
            Object.fromEntries(
              Object.entries(apis).map(([key, options]) => [
                key,
                withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
                  tool.kind === "mutation" ? always() : undefined,
                ),
              ]),
            ) as Record<keyof typeof apis, ReturnType<typeof liveOpenapiRouter>>,
            { title: "Benzinga", description: "Benzinga APIs." },
          ),
        { signal },
      ),
      {
        title: "Benzinga",
        description:
          "Benzinga financial data. news: real-time news and Why Is It Moving. calendar: earnings, dividends, splits, IPOs, FDA, M&A, guidance, ratings. consensusRatings, analystInsights, bullBear, transcripts. bars and quotes: market data. fundamentals, movers, governmentTrades, secFilings, shortInterest, signals, tickerTrends, wiims, logos.",
        icons,
      },
    ),
  }),
);
