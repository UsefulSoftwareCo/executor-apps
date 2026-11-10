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

const hitpay = defineProvider({
  name: "HitPay",
  hosts: ["api.hit-pay.com"],
  auth: {
    apiKey: secrets({
      label: "Business API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Any business Owner or Admin can create an OAuth app (Developers > App Builder). The
    // scopes payments, commerce and customer need HitPay approval before they can be requested.
    oauth: oauth2({
      authorizationUrl: "https://dashboard.hit-pay.com/oauth/authorize",
      tokenUrl: "https://api.hit-pay.com/v1/open/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["business:read"],
    }),
  },
  async health({ account, fetch, signal }) {
    // Both calls only need a successful response; bank_account_status is not always present.
    const response =
      account.method === "oauth"
        ? await fetch("https://api.hit-pay.com/v1/info", {
            signal,
            headers: { Authorization: `Bearer ${account.fields.access_token}` },
          })
        : await fetch("https://api.hit-pay.com/v1/account-status", {
            signal,
            headers: { "X-BUSINESS-API-KEY": account.fields.token },
          });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { hitpay: hitpay.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hitpay ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "HitPay",
        description:
          "Payments with HitPay: payment requests, charges, refunds, invoices, orders, subscriptions, payouts, transfers, customers and products.",
        icons,
      },
    ),
  }),
);
