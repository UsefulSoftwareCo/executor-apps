import {
  accountRouter,
  defineApp,
  defineProvider,
  oauth2,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const paypal = defineProvider({
  name: "PayPal",
  hosts: ["api-m.paypal.com"],
  auth: {
    // A REST app in your own PayPal account: client ID and secret exchanged for a token (no user consent step).
    clientCredentials: oauth2({
      grant: "client_credentials",
      tokenUrl: "https://api-m.paypal.com/v1/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: [],
    }),
  },
  // PayPal has no current-user endpoint for client-credentials tokens; listing webhooks is a read-only call.
  // It returns 403 if the app lacks the Webhooks feature, which is reported as a rejected token.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api-m.paypal.com/v1/notifications/webhooks", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`PayPal rejected the access token (HTTP ${response.status}).`);
    return { accountInfo: { displayName: "PayPal REST app" } };
  },
});

export default defineApp(
  { user: { accounts: { paypal: paypal.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.paypal ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            Object.fromEntries(Object.entries(apis).map(([key, options]) => [key, mount(options)])) as Record<
              keyof typeof apis,
              ReturnType<typeof mount>
            >,
            { title: "PayPal", description: "PayPal account." },
          );
        },
        { signal },
      ),
      {
        title: "PayPal",
        description:
          "PayPal. orders: create, authorize and capture checkout orders. payments: captures, authorizations, refunds. subscriptions: billing plans and subscriptions. invoicing: invoices and templates. payouts: batch payouts. products: catalog products. disputes: customer disputes. webhooks: webhooks and events. transactions: transaction and balance reports. tracking: shipment tracking. vault: saved payment tokens. partnerReferrals and webExperienceProfiles: partner onboarding and checkout experience.",
        icons,
      },
    ),
  }),
);
