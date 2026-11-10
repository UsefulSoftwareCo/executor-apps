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

const finmo = defineProvider({
  name: "Finmo",
  hosts: ["api.finmo.net"],
  auth: {
    apiKey: secrets({
      label: "API key pair (Access API key and Secret API key)",
      fields: object({ accessKey: string({ minLength: 1 }), secretKey: string({ minLength: 1 }) }),
    }),
  },
  // The key pair decides sandbox vs production. Listing wallets is a read-only call every key can make.
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.finmo.net/v1/wallet?limit=1", {
      signal,
      headers: {
        Authorization: `Basic ${btoa(`${account.fields.accessKey}:${account.fields.secretKey}`)}`,
      },
    });
    if (!response.ok) throw new Error(`Finmo health check failed (${response.status})`);
  },
});

export default defineApp(
  { user: { accounts: { finmo: finmo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.finmo ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Finmo",
        description: "Collect and send money with Finmo: payins, payouts, wallets, FX, virtual accounts, customers, checkouts and refunds.",
        icons,
      },
    ),
  }),
);
