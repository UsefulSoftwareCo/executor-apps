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

const Account = object({ id: string() });

const stripe = defineProvider({
  name: "Stripe",
  hosts: ["api.stripe.com"],
  auth: {
    apiKey: secrets({
      label: "Secret or restricted API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.stripe.com/v1/account", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    const me = await decodeJson(response, Account);
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { stripe: stripe.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.stripe ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Stripe",
        description: "Payments, customers, subscriptions, invoices, payouts and the rest of the Stripe API.",
        instructions:
          "Use a test-mode key (sk_test_) to experiment. Stripe request bodies are form-encoded; nested fields use bracket keys such as metadata[order_id]. List endpoints page with starting_after.",
        icons,
      },
    ),
  }),
);
