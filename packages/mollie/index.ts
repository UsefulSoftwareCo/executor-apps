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

const Resource = object({ id: string() });

const mollie = defineProvider({
  name: "Mollie",
  hosts: ["api.mollie.com"],
  auth: {
    token: secrets({
      label: "API key or access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Mollie Connect: the connect page asks for the OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://my.mollie.com/oauth2/authorize",
      tokenUrl: "https://api.mollie.com/oauth2/tokens",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "payments.read", "payments.write", "refunds.read", "refunds.write",
        "customers.read", "customers.write", "mandates.read", "mandates.write",
        "subscriptions.read", "subscriptions.write", "payment-links.read", "payment-links.write",
        "profiles.read", "profiles.write", "organizations.read", "settlements.read",
        "balances.read", "invoices.read", "terminals.read", "terminals.write",
        "payouts.read", "events.read", "webhooks.read", "webhooks.write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    // profiles/me accepts only profile API keys; access tokens (OAuth or
    // organization access tokens) need organizations/me (organizations.read).
    const isApiKey = account.method === "token" && !String(token).startsWith("access_");
    const path = isApiKey ? "profiles/me" : "organizations/me";
    const response = await fetch(`https://api.mollie.com/v2/${path}`, {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, Resource);
  },
});

export default defineApp(
  { user: { accounts: { mollie: mollie.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mollie ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Mollie",
        description:
          "Accept and manage payments with Mollie: payments, refunds, customers, mandates, subscriptions, payment links, settlements and balances.",
        icons,
      },
    ),
  }),
);
