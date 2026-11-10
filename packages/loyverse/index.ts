import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
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

const Merchant = object({ id: string() });

const loyverse = defineProvider({
  name: "Loyverse",
  hosts: ["api.loyverse.com"],
  auth: {
    accessToken: secrets({
      label: "Access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Loyverse has no client registration: the connect page asks for a developer app's client.
    oauth: oauth2({
      discover: "https://api.loyverse.com",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "ITEMS_READ",
        "ITEMS_WRITE",
        "INVENTORY_READ",
        "INVENTORY_WRITE",
        "CUSTOMERS_READ",
        "CUSTOMERS_WRITE",
        "EMPLOYEES_READ",
        "MERCHANT_READ",
        "PAYMENT_TYPES_READ",
        "POS_DEVICES_READ",
        "POS_DEVICES_WRITE",
        "RECEIPTS_READ",
        "RECEIPTS_WRITE",
        "SHIFTS_READ",
        "STORES_READ",
        "SUPPLIERS_READ",
        "SUPPLIERS_WRITE",
        "TAXES_READ",
        "TAXES_WRITE",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.loyverse.com/v1.0/merchant/", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Merchant);
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { loyverse: loyverse.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.loyverse ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Loyverse",
        description:
          "Loyverse point of sale: items, categories, inventory, receipts, customers, stores, employees, shifts, taxes, suppliers and webhooks.",
        icons,
      },
    ),
  }),
);
