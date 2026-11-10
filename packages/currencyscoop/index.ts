import {
  accountRouter,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  toolAnnotations,
  withApprovals,
} from "apps";
import { mcpHealth, mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://api.currencybeacon.com/mcp";

const currencybeacon = defineProvider({
  name: "CurrencyScoop",
  hosts: ["api.currencybeacon.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  health: (check) =>
    mcpHealth(check, { url, headers: { Authorization: `Bearer ${check.account.fields.token}` } }),
});

export default defineApp(
  { user: { accounts: { currencyscoop: currencybeacon.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.currencyscoop ?? [],
        async (account) =>
          withApprovals(
            await mcpRouter({
              url,
              account,
              headers: { Authorization: `Bearer ${account.fields.token}` },
              signal,
            }),
            (tool) => (toolAnnotations(tool)?.readOnlyHint === true ? undefined : always()),
          ),
        { signal },
      ),
      {
        title: "CurrencyScoop",
        description:
          "CurrencyBeacon (formerly CurrencyScoop) exchange rates: latest, historical, time series, conversion, supported currencies and API usage.",
        icons,
      },
    ),
  }),
);
