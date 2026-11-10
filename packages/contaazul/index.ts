import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import {
  contractsOptions,
  financialOptions,
  invoicesOptions,
  peopleOptions,
  productsOptions,
  salesOptions,
} from "./openapi.js";

const contaazul = defineProvider({
  name: "Conta Azul",
  hosts: ["api-v2.contaazul.com", "auth.contaazul.com"],
  auth: {
    // Conta Azul has no shared client: the user creates an application in the Developer Portal.
    oauth: oauth2({
      authorizationUrl: "https://auth.contaazul.com/login",
      tokenUrl: "https://api-v2.contaazul.com/oauth/token",
      tokenEndpointAuthMethod: "client_secret_basic",
      scopes: ["openid", "profile", "aws.cognito.signin.user.admin"],
      scopeSeparator: " ",
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api-v2.contaazul.com/v1/pessoas/conta-conectada", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}`, Accept: "application/json" },
    });
    // The vendor's Empresa schema marks no field required, so only success is checked.
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { contaazul: contaazul.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.contaazul ?? [],
        (account) => {
          const mount = (options: Parameters<typeof liveOpenapiRouter>[0]["source"] extends never ? never : Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              financial: mount(financialOptions),
              sales: mount(salesOptions),
              people: mount(peopleOptions),
              products: mount(productsOptions),
              invoices: mount(invoicesOptions),
              contracts: mount(contractsOptions),
            },
            { title: "Conta Azul", description: "Conta Azul account." },
          );
        },
        { signal },
      ),
      {
        title: "Conta Azul",
        description:
          "Conta Azul ERP. financial: receivables, payables, installments, financial accounts, categories, cost centers, transfers. sales: sales and items. people: customers, suppliers, carriers. products: products and services. invoices: fiscal invoices (NF-e, NFS-e). contracts: recurring contracts.",
        icons,
      },
    ),
  }),
);
