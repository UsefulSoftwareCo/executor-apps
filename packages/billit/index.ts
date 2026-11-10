import {
  accountRouter,
  defineApp,
  defineProvider,
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
import { options, productionOrigin, sandboxOrigin } from "./openapi.js";

function originOf(environment: string): string {
  const value = environment.trim().toLowerCase();
  if (value === "production") return productionOrigin;
  if (value === "sandbox") return sandboxOrigin;
  throw new Error('Environment must be "production" or "sandbox".');
}

const billit = defineProvider({
  name: "Billit",
  hosts: ["api.billit.be", "api.sandbox.billit.be"],
  auth: {
    apiKey: secrets({
      label: "API key and party ID",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        partyId: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.environment);
    const response = await fetch(`${origin}/v1/account/accountInformation`, {
      signal,
      headers: { apikey: account.fields.token, partyid: account.fields.partyId, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Billit rejected the API key or party ID (status ${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { billit: billit.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.billit ?? [],
        (account) => {
          const origin = originOf(account.fields.environment);
          return withApprovals(
            liveOpenapiRouter({ ...options, allowedOrigin: origin, baseUrl: origin, cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Billit",
        description:
          "Billit invoicing and Peppol e-invoicing: orders (invoices, quotes, credit notes), parties, products, documents, payments, cashbook, reports and webhooks.",
        icons,
      },
    ),
  }),
);
