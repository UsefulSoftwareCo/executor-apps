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

const tracify = defineProvider({
  name: "Tracify",
  hosts: ["tracify-api.tracify.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Tracify has no current-user endpoint and every data route needs a site ID. A request for a nil-UUID site is
  // authenticated first: a bad token answers 401/403, a valid one gets a different status (e.g. 403 for site access
  // is indistinguishable, so only 401 is treated as rejection).
  async health({ account, fetch, signal }) {
    const response = await fetch(
      "https://tracify-api.tracify.ai/analytics/api/v1/events/00000000-0000-0000-0000-000000000000/export/async/00000000-0000-0000-0000-000000000000",
      { signal, headers: { "tracify-token": account.fields.token, accept: "application/json" } },
    );
    if (response.status === 401) throw new Error("Tracify rejected the API token (401)");
  },
});

export default defineApp(
  { user: { accounts: { tracify: tracify.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tracify ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Tracify",
        description:
          "Query Tracify marketing attribution analytics: KPIs by channel, customer journeys, conversion paths, discount codes and event exports.",
        icons,
      },
    ),
  }),
);
