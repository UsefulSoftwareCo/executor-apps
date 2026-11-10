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

const billsby = defineProvider({
  name: "Billsby",
  hosts: ["public.billsby.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        token: string({ minLength: 1 }),
        companyDomain: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const domain = encodeURIComponent(account.fields.companyDomain);
    const response = await fetch(
      `https://public.billsby.com/api/v1/rest/core/${domain}/products?page=1&pageSize=1`,
      { signal, headers: { apikey: account.fields.token, accept: "application/json" } },
    );
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { billsby: billsby.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.billsby ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account,
              parameterDefaults: { path: { companyDomain: String(account.fields.companyDomain) } },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Billsby",
        description:
          "Manage Billsby subscription billing: customers, subscriptions, invoices, credit notes, products, plans, add-ons and allowances.",
        icons,
      },
    ),
  }),
);
