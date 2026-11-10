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

const autumn = defineProvider({
  name: "Autumn",
  hosts: ["api.useautumn.com"],
  auth: {
    apiKey: secrets({
      label: "Secret key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.useautumn.com/v1/plans.list", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "Content-Type": "application/json" },
      body: "{}",
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { autumn: autumn.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.autumn ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Autumn",
        description:
          "Billing for AI and SaaS on Stripe: customers, plans, features, subscriptions, balances, usage tracking, invoices, entities, rewards and webhooks.",
        icons,
      },
    ),
  }),
);
