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

const plisio = defineProvider({
  name: "Plisio",
  hosts: ["plisio.net"],
  auth: {
    apiKey: secrets({
      label: "Secret key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /shops ("Get shop info by api_key") is read-only; every response carries a status.
  async health({ account, fetch, signal }) {
    const url = new URL("https://plisio.net/api/v1/shops");
    url.searchParams.set("api_key", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({ status: string() }));
  },
});

export default defineApp(
  { user: { accounts: { plisio: plisio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.plisio ?? [],
        (account) =>
          // `kinds` in openapi.ts marks the GET operations that change state as mutations.
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Plisio",
        description: "Accept and send cryptocurrency payments with Plisio: invoices, operations, balances, withdrawals, fees, exchanges, coins and deposits.",
        icons,
      },
    ),
  }),
);
