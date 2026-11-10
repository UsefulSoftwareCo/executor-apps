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
import { options } from "./openapi.js";

const avalara = defineProvider({
  name: "Avalara",
  hosts: ["rest.avatax.com"],
  auth: {
    apiKey: secrets({
      label: "Account ID and license key (or username and password)",
      fields: object({ username: string({ minLength: 1 }), password: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const credentials = btoa(`${account.fields.username}:${account.fields.password}`);
    const response = await fetch("https://rest.avatax.com/api/v2/utilities/subscriptions", {
      signal,
      headers: { Authorization: `Basic ${credentials}`, Accept: "application/json",
        "X-Avalara-Client": "Executor; 1.0; REST; v2; executor",
      },
    });
    if (!response.ok) {
      throw new Error(`Avalara rejected the credentials (HTTP ${response.status})`);
    }
  },
});

export default defineApp(
  { user: { accounts: { avalara: avalara.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.avalara ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Avalara",
        description:
          "Calculate and manage sales and use tax with Avalara AvaTax: transactions, companies, tax codes, nexus, exemption certificates, items, addresses and filings.",
        icons,
      },
    ),
  }),
);
