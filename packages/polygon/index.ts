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

const polygon = defineProvider({
  name: "Polygon",
  hosts: ["api.massive.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(
      `https://api.massive.com/v1/marketstatus/now`,
      { headers: { Authorization: `Bearer ${account.fields.token}` }, signal },
    );
    await decodeJson(response, object({ market: string() }));
  },
});

export default defineApp(
  { user: { accounts: { polygon: polygon.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.polygon ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Polygon",
        description:
          "Polygon.io (now Massive) financial market data: stocks, options, futures, indices, forex and crypto aggregates, trades, quotes, snapshots, reference data, fundamentals and news.",
        icons,
      },
    ),
  }),
);
