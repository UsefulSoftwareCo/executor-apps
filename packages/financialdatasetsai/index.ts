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
import { options } from "./openapi.js";

const financialDatasets = defineProvider({
  name: "Financial Datasets",
  hosts: ["api.financialdatasets.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Authenticated read-only GET (the tickers listing endpoints are public and
  // would pass with any key). 401/403 mean a bad key; 402 means a valid key on a
  // plan without access to this data, which still counts as connected.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.financialdatasets.ai/prices/snapshot?ticker=AAPL", {
      signal,
      headers: { "X-API-KEY": account.fields.token },
    });
    if (response.status === 402) return;
    if (!response.ok) throw new Error(`Financial Datasets health check failed: ${response.status}`);
  },
});

export default defineApp(
  { user: { accounts: { financialdatasets: financialDatasets.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.financialdatasets ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Financial Datasets",
        description:
          "US public company data: financial statements, metrics, prices, SEC filings, insider and institutional ownership, earnings, news, estimates and macro series.",
        icons,
      },
    ),
  }),
);
