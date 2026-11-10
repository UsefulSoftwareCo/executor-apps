import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  plain,
  raw,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import {
  assetPricesOptions,
  combosOptions,
  eventsOptions,
  incentivesOptions,
  marketsOptions,
  ordersOptions,
  portfolioOptions,
  priceHistoryOptions,
  rfqsOptions,
  searchOptions,
  seriesOptions,
  sportsOptions,
  tagsOptions,
} from "./openapi.js";

type Fetch = typeof fetch;
type MountOptions = Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">;

const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string) => Uint8Array.from(atob(text.trim()), (char) => char.charCodeAt(0));

// DER prefix of a PKCS#8 Ed25519 private key; the 32-byte seed follows it.
const pkcs8Prefix = Uint8Array.from([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
]);

// Polymarket US signs each request: X-PM-Signature is the base64 Ed25519 signature of
// `timestamp + METHOD + path` (path only; whether the server also signs the query string is
// unverified, see README), using the first 32 bytes of the base64-decoded secret as the seed.
// The timestamp is Unix milliseconds and must be within 30 seconds of server time.
const signingFetch =
  (keyId: string, secretKey: string, inner: Fetch): Fetch =>
  async (input, init) => {
    const seed = fromBase64(secretKey).slice(0, 32);
    if (seed.length !== 32) throw new Error("The Polymarket US secret key must be the base64 secret shown when the key was created.");
    const der = new Uint8Array(pkcs8Prefix.length + 32);
    der.set(pkcs8Prefix);
    der.set(seed, pkcs8Prefix.length);
    const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, false, ["sign"]);
    const request = new Request(input, init);
    const timestamp = String(Date.now());
    const message = `${timestamp}${request.method.toUpperCase()}${new URL(request.url).pathname}`;
    const signature = await crypto.subtle.sign({ name: "Ed25519" }, key, new TextEncoder().encode(message));
    request.headers.set("X-PM-Access-Key", keyId);
    request.headers.set("X-PM-Timestamp", timestamp);
    request.headers.set("X-PM-Signature", base64(new Uint8Array(signature)));
    return inner(request);
  };

const polymarketUs = defineProvider({
  name: "Polymarket US",
  hosts: ["api.polymarket.us", "gateway.polymarket.us"],
  auth: {
    apiKey: secrets({
      label: "API key (Key ID and Secret Key)",
      fields: object({
        keyId: plain(string({ minLength: 1 })),
        // The app must read the secret to sign requests.
        secretKey: raw(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const signed = signingFetch(account.fields.keyId, account.fields.secretKey, fetch);
    const response = await signed("https://api.polymarket.us/v1/account/balances", { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { polymarketUs: polymarketUs.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.polymarketUs ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          const publicMount = (options: MountOptions) =>
            approve(liveOpenapiRouter({ ...options, cache, fetch, signal, account }));
          const signed = signingFetch(account.fields.keyId, account.fields.secretKey, fetch);
          const privateMount = (options: Parameters<typeof publicMount>[0]) =>
            approve(liveOpenapiRouter({ ...options, cache, fetch: signed, signal, account }));
          return router({
            markets: publicMount(marketsOptions),
            events: publicMount(eventsOptions),
            series: publicMount(seriesOptions),
            search: publicMount(searchOptions),
            sports: publicMount(sportsOptions),
            tags: publicMount(tagsOptions),
            priceHistory: publicMount(priceHistoryOptions),
            assetPrices: publicMount(assetPricesOptions),
            orders: privateMount(ordersOptions),
            portfolio: privateMount(portfolioOptions),
            rfqs: privateMount(rfqsOptions),
            combos: privateMount(combosOptions),
            incentives: privateMount(incentivesOptions),
          });
        },
        { signal },
      ),
      {
        title: "Polymarket US",
        description:
          "Trade and research CFTC-regulated Polymarket US prediction markets: events, markets, order books, price history, sports, search, orders, portfolio, RFQs and combos.",
        icons,
        instructions:
          "Public market data (markets, events, series, search, sports, tags, priceHistory, assetPrices) needs no signature. Orders, portfolio, rfqs, combos and incentives are signed per request with the account's Ed25519 key. This is Polymarket US only, not the global Polymarket product.",
      },
    ),
  }),
);
