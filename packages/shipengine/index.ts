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
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const shipengine = defineProvider({
  name: "ShipEngine",
  hosts: ["api.shipengine.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.shipengine.com/v1/carriers", {
      signal,
      headers: { "API-Key": account.fields.token },
    });
    await decodeJson(response, object({ carriers: array(object({})) }));
  },
});

export default defineApp(
  { user: { accounts: { shipengine: shipengine.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shipengine ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "ShipEngine",
        description: "Shipping labels, rates, tracking, address validation, carriers, shipments, batches and warehouses with ShipEngine.",
        icons,
      },
    ),
  }),
);
