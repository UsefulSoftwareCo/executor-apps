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

// Reads that return credentials still need approval.
const sensitiveReads = new Set(["webhooks.getWebhookSecret"]);

const creem = defineProvider({
  name: "Creem",
  hosts: ["api.creem.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.creem.io/v1/products/search?page_size=1", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { creem: creem.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.creem ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || sensitiveReads.has(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Creem",
        description: "Creem merchant-of-record payments: products, checkouts, customers, subscriptions, licenses, discounts, transactions, refunds, credits, meters and affiliates.",
        icons,
      },
    ),
  }),
);
