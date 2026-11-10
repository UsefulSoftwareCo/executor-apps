import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  jsonSchema,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { optionsFor, regionUrl } from "./openapi.js";

const Merchant = object({ name: string() });

const description =
  "Clover merchants, inventory, orders, payments, customers, employees, cash events, devices, apps and billing through the Platform REST API.";

const clover = defineProvider({
  name: "Clover",
  hosts: ["api.clover.com", "api.eu.clover.com", "api.la.clover.com", "apisandbox.dev.clover.com"],
  auth: {
    // Clover's OAuth redirect hands back the merchant id and uses a separate refresh endpoint on a
    // regional host, none of which the framework's OAuth flow can carry, so only API tokens are offered.
    apiToken: secrets({
      label: "Merchant API token",
      fields: object({
        region: plain(jsonSchema({ type: "string", enum: ["na", "eu", "la", "sandbox"] })),
        merchantId: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = regionUrl(account.fields.region);
    const merchantId = encodeURIComponent(account.fields.merchantId.trim());
    const response = await fetch(`${base}/v3/merchants/${merchantId}`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const merchant = await decodeJson(response, Merchant);
    return { accountInfo: { externalId: account.fields.merchantId.trim(), displayName: merchant.name } };
  },
});

export default defineApp(
  { user: { accounts: { clover: clover.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.clover ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({ ...optionsFor(account.fields.region), cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      { title: "Clover", description, icons },
    ),
  }),
);
