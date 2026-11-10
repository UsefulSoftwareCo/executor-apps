import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const User = object({ data: object({ id: string() }) });

const coinbase = defineProvider({
  name: "Coinbase",
  hosts: ["api.coinbase.com", "login.coinbase.com"],
  auth: {
    // Coinbase App OAuth2: register an app at https://portal.cdp.coinbase.com/oauth.
    oauth: oauth2({
      authorizationUrl: "https://login.coinbase.com/oauth2/auth",
      tokenUrl: "https://login.coinbase.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopeSeparator: ",",
      scopes: [
        "wallet:user:read",
        "wallet:accounts:read",
        "wallet:buys:create",
        "wallet:sells:create",
        "wallet:user:update",
        "wallet:trades:read",
        "wallet:trades:create",
        "wallet:transactions:read",
        "wallet:payment-methods:read",
        "offline_access",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.coinbase.com/v2/user", {
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.access_token}`,
        "CB-VERSION": "2019-08-15",
      },
    });
    const me = await decodeJson(response, User);
    return { accountInfo: { externalId: me.data.id } };
  },
});

export default defineApp(
  { user: { accounts: { coinbase: coinbase.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.coinbase ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Coinbase",
        description:
          "Coinbase Advanced Trade: accounts, orders, fills, products, market data, portfolios, conversions and payment methods.",
        icons,
      },
    ),
  }),
);
