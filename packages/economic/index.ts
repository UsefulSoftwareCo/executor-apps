import {
  accountRouter,
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
import { apis } from "./openapi.js";

const economic = defineProvider({
  name: "e-conomic",
  hosts: ["apis.e-conomic.com", "restapi.e-conomic.com"],
  auth: {
    apiKey: secrets({
      label: "App secret token and agreement grant token",
      fields: object({
        appSecretToken: string({ minLength: 1 }),
        agreementGrantToken: string({ minLength: 1 }),
      }),
    }),
  },
  // GET / on the REST API describes the agreement the tokens belong to; it needs both headers.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://restapi.e-conomic.com/self", {
      signal,
      headers: {
        "X-AppSecretToken": account.fields.appSecretToken,
        "X-AgreementGrantToken": account.fields.agreementGrantToken,
      },
    });
    if (!response.ok) throw new Error(`e-conomic rejected the tokens (${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { economic: economic.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.economic ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              accountingYears: mount(apis.accountingYears),
              accounts: mount(apis.accounts),
              bookedEntries: mount(apis.bookedEntries),
              budgets: mount(apis.budgets),
              customers: mount(apis.customers),
              dimensions: mount(apis.dimensions),
              documents: mount(apis.documents),
              journals: mount(apis.journals),
              products: mount(apis.products),
              projects: mount(apis.projects),
              quoteToCash: mount(apis.quoteToCash),
              subscriptions: mount(apis.subscriptions),
              suppliers: mount(apis.suppliers),
            },
            { title: "e-conomic", description: "e-conomic agreement." },
          );
        },
        { signal },
      ),
      {
        title: "e-conomic",
        description:
          "Visma e-conomic accounting. customers, suppliers, products, quoteToCash (quotes, orders, invoices), journals, accounts, bookedEntries, accountingYears, budgets, dimensions, documents, projects and subscriptions.",
        icons,
      },
    ),
  }),
);
