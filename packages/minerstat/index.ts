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

const minerstat = defineProvider({
  name: "Minerstat",
  hosts: ["api.minerstat.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // A one-coin listing is read-only and counts as a single request against the monthly quota.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.minerstat.com/v3/coins?limit=1", {
      signal,
      headers: { "X-Api-Key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { minerstat: minerstat.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.minerstat ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Minerstat",
        description: "Crypto mining data from Minerstat: coins, hardware, algorithms, pools and profitability.",
        icons,
      },
    ),
  }),
);
