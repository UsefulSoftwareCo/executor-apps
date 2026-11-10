import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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
import { options } from "./openapi.js";

// Every Chargebee site lives on its own host: https://<site>.chargebee.com (a test site is <site>-test).
function normalizeSite(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9_-]*)(?:\.chargebee\.com)?\/?$/.exec(raw.trim().toLowerCase());
  if (match === null)
    throw new Error("Enter the <site> of <site>.chargebee.com, for example acme or acme-test.");
  return match[1]!;
}

const chargebee = defineProvider({
  name: "Chargebee",
  hosts: ["*.chargebee.com"],
  auth: {
    // A Chargebee API key (Settings > Configure Chargebee > API Keys) is sent as the Basic username with an empty
    // password. Keys belong to one site, so the site name is part of the account.
    apiKey: secrets({
      label: "API key",
      fields: object({
        site: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const site = normalizeSite(account.fields.site);
    const response = await fetch(`https://${site}.chargebee.com/api/v2/customers?limit=1`, {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.apiKey}:`)}`,
        Accept: "application/json",
      },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: site, displayName: `${site}.chargebee.com` } };
  },
});

export default defineApp(
  { user: { accounts: { chargebee: chargebee.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.chargebee ?? [],
        (account) => {
          const origin = `https://${normalizeSite(account.fields.site)}.chargebee.com`;
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api/v2`,
              cache,
              fetch,
              signal,
              // The key is the Basic username; the password is empty.
              account: { ...account, fields: { ...account.fields, basicPassword: "" } },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Chargebee",
        description:
          "Subscription billing in Chargebee: customers, subscriptions, invoices, credit notes, plans and items, coupons, payment sources, transactions and more.",
        instructions:
          "Each account is one Chargebee site; use a <site>-test account for the test site. Request bodies are form-encoded by Chargebee itself and handled by the tools.",
        icons,
      },
    ),
  }),
);
