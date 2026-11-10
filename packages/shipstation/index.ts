import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options, v1Options } from "./openapi.js";

const shipstation = defineProvider({
  name: "ShipStation",
  hosts: ["api.shipstation.com", "ssapi.shipstation.com"],
  auth: {
    apiKey: secrets({
      label: "API v2 key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    legacy: secrets({
      label: "Legacy API v1 key and secret",
      fields: object({ apiKey: string({ minLength: 1 }), apiSecret: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "legacy") {
      const response = await fetch("https://ssapi.shipstation.com/accounts/listtags", {
        signal,
        headers: {
          Authorization: `Basic ${btoa(`${account.fields.apiKey}:${account.fields.apiSecret}`)}`,
          Accept: "application/json",
        },
      });
      await decodeJson(response, json());
      return;
    }
    const response = await fetch("https://api.shipstation.com/v2/users?page_size=1", {
      signal,
      headers: { "api-key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { shipstation: shipstation.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shipstation ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...(account.method === "legacy" ? v1Options : options),
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "ShipStation",
        description:
          "Shipping rates, labels, shipments, batches, manifests, tracking, carriers, warehouses and inventory with ShipStation API v2, or orders and fulfillment with the legacy v1 API.",
        icons,
      },
    ),
  }),
);
