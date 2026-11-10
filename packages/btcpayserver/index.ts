import {
  accountRouter,
  decodeJson,
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
import { options } from "./openapi.js";


// BTCPay Server is self-hosted, so the instance URL is part of the account. The provider declares
// no `hosts`: instance domains are arbitrary and the framework only accepts static lists, so the token
// is not host-restricted by the framework. Mitigations: tool calls pin allowedOrigin to the account's own
// instance origin, and instanceBase requires https. The health fetch is not pinned beyond that.
// Same pattern as the other self-hosted packages in this batch (gitea, metabase, unleash).
// Sub-path installs (https://example.com/btcpay) keep their path.
function instanceBase(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your BTCPay Server URL, for example https://btcpay.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The BTCPay Server instance must use https.");
  if (url.search !== "" || url.hash !== "") throw new Error("The BTCPay Server URL must not include a query or fragment.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

const btcpayserver = defineProvider({
  name: "BTCPay Server",
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const base = instanceBase(account.fields.instance);
    const response = await fetch(`${base}/api/v1/api-keys/current`, {
      signal,
      headers: { Authorization: `token ${account.fields.token}`, Accept: "application/json" },
    });
    const key = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: `${base}:${key.id}`, displayName: base } };
  },
});

export default defineApp(
  { user: { accounts: { btcpayserver: btcpayserver.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.btcpayserver ?? [],
        (account) => {
          const base = instanceBase(account.fields.instance);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: new URL(base).origin,
              baseUrl: base,
              cache,
              fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "BTCPay Server",
        description:
          "Stores, invoices, payment requests, pull payments, payouts, wallets, apps, webhooks and users on a self-hosted BTCPay Server (Greenfield API).",
        icons,
      },
    ),
  }),
);
