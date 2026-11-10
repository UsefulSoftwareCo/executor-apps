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

const agiled = defineProvider({
  name: "Agiled",
  hosts: ["my.agiled.app"],
  auth: {
    apiKey: secrets({
      label: "API token and account URL",
      fields: object({
        token: string({ minLength: 1 }),
        brand: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL("https://my.agiled.app/api/v1/currencies");
    url.searchParams.set("api_token", account.fields.token);
    const response = await fetch(url.toString(), { signal, headers: { Brand: account.fields.brand } });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { agiled: agiled.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.agiled ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch,
              signal,
              account,
              parameterDefaults: {
                query: { api_token: String(account.fields.token) },
                headers: { Brand: String(account.fields.brand) },
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Agiled",
        description:
          "Agiled business management: CRM contacts, accounts and deals, projects and tasks, invoices, estimates, expenses, payments, tickets and time logs.",
        icons,
      },
    ),
  }),
);
