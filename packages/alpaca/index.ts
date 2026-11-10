import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { marketData, trading, tradingOrigin, type Environment } from "./openapi.js";

const keyFields = object({ keyId: string({ minLength: 1 }), secretKey: string({ minLength: 1 }) });

// Alpaca's OAuth app registration is manual and its authorization server publishes no metadata.
// The docs do not state token expiry; no refresh token is issued. `env` pins the token to one account; without it Alpaca asks for both.
const oauth = (env: Environment) =>
  oauth2({
    authorizationUrl: "https://app.alpaca.markets/oauth/authorize",
    tokenUrl: "https://api.alpaca.markets/oauth/token",
    tokenEndpointAuthMethod: "client_secret_post",
    scopes: ["account:write", "trading", "data"],
    authorizationParams: { env },
  });

const alpaca = defineProvider({
  name: "Alpaca",
  hosts: ["api.alpaca.markets", "paper-api.alpaca.markets", "data.alpaca.markets"],
  auth: {
    paperKeys: secrets({ label: "Paper trading API keys", fields: keyFields }),
    liveKeys: secrets({ label: "Live trading API keys", fields: keyFields }),
    paperOAuth: oauth("paper"),
    liveOAuth: oauth("live"),
  },
  async health({ account, fetch, signal }) {
    const environment: Environment = account.method.startsWith("paper") ? "paper" : "live";
    const headers: Record<string, string> =
      account.method === "paperKeys" || account.method === "liveKeys"
        ? { "APCA-API-KEY-ID": account.fields.keyId, "APCA-API-SECRET-KEY": account.fields.secretKey }
        : { Authorization: `Bearer ${account.fields.access_token}` };
    const response = await fetch(`${tradingOrigin(environment)}/v2/account`, { signal, headers });
    const me = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: me.id } };
  },
});

export default defineApp(
  { user: { accounts: { alpaca: alpaca.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      {
        trading: await accountRouter(
          user?.accounts.alpaca ?? [],
          (account) =>
            withApprovals(
              liveOpenapiRouter({
                ...trading(account.method.startsWith("paper") ? "paper" : "live"),
                cache,
                fetch,
                signal,
                account,
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            ),
          { signal },
        ),
        marketData: await accountRouter(
          user?.accounts.alpaca ?? [],
          (account) =>
            withApprovals(liveOpenapiRouter({ ...marketData, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            ),
          { signal },
        ),
      },
      {
        title: "Alpaca",
        description:
          "Trade US stocks, options and crypto and read market data with Alpaca: account, orders, positions, assets, watchlists, historical bars, quotes, trades, snapshots and news.",
        icons,
        instructions:
          "Trading tools live under trading.* and market data under marketData.*. A paper account only reaches paper-api.alpaca.markets and a live account only api.alpaca.markets; connect the one you mean to use. Placing, replacing or cancelling orders and closing positions moves real money on a live account.",
      },
    ),
  }),
);
