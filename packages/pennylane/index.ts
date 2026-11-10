import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const Me = object({ company: object({ id: number(), name: string() }) });

const pennylane = defineProvider({
  name: "Pennylane",
  hosts: ["app.pennylane.com"],
  auth: {
    apiToken: secrets({
      label: "Company API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://app.pennylane.com/api/external/v2/me", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    const me = await decodeJson(response, Me);
    return { accountInfo: { externalId: String(me.company.id), username: me.company.name } };
  },
});

export default defineApp(
  { user: { accounts: { pennylane: pennylane.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pennylane ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pennylane",
        description:
          "Customer and supplier invoices, ledger entries and accounts, bank transactions, customers, suppliers, products and exports from the Pennylane Company API.",
        icons,
      },
    ),
  }),
);
