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
import { apis } from "./openapi.js";

const apiHost = "api.polymarket.us";

// PKCS#8 prefix for a raw 32-byte Ed25519 private key.
const pkcs8Prefix = Uint8Array.from([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
]);

function base64ToBytes(value: string) {
  const binary = atob(value.trim());
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// The Secret Key is a base64 Ed25519 key; its first 32 bytes are the private seed.
async function signingKey(secretKey: string) {
  const bytes = base64ToBytes(secretKey);
  if (bytes.length < 32) throw new Error("The Polymarket US Secret Key is too short; paste the full base64 secret.");
  const pkcs8 = new Uint8Array(pkcs8Prefix.length + 32);
  pkcs8.set(pkcs8Prefix);
  pkcs8.set(bytes.slice(0, 32), pkcs8Prefix.length);
  return crypto.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, false, ["sign"]);
}

// Signature = base64(Ed25519(timestampMs + METHOD + path)); the query string is not signed.
async function signedHeaders(account: { fields: { keyId: string; secretKey: string } }, method: string, url: URL) {
  const timestamp = Date.now().toString();
  const key = await signingKey(account.fields.secretKey);
  const message = new TextEncoder().encode(`${timestamp}${method.toUpperCase()}${url.pathname}`);
  const signature = new Uint8Array(await crypto.subtle.sign("Ed25519", key, message));
  return {
    "X-PM-Access-Key": account.fields.keyId.trim(),
    "X-PM-Timestamp": timestamp,
    "X-PM-Signature": bytesToBase64(signature),
  };
}

type Fetch = typeof globalThis.fetch;

function signingFetch(base: Fetch, account: { fields: { keyId: string; secretKey: string } }): Fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.hostname !== apiHost) return base(request);
    const headers = new Headers(request.headers);
    for (const [name, value] of Object.entries(await signedHeaders(account, request.method, url))) {
      headers.set(name, value);
    }
    return base(new Request(request, { headers }));
  };
}

const polymarket = defineProvider({
  name: "Polymarket US",
  hosts: ["api.polymarket.us", "gateway.polymarket.us"],
  auth: {
    apiKey: secrets({
      label: "API Key ID and Secret Key",
      fields: object({
        keyId: plain(string({ minLength: 1 })),
        secretKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL(`https://${apiHost}/v1/account/balances`);
    const response = await fetch(url, {
      signal,
      headers: await signedHeaders(account, "GET", url),
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: account.fields.keyId, displayName: account.fields.keyId } };
  },
});

export default defineApp(
  { user: { accounts: { polymarket: polymarket.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.polymarket ?? [],
        (account) => {
          const signed = signingFetch(fetch, account);
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch: signed, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              events: mount(apis.events),
              markets: mount(apis.markets),
              search: mount(apis.search),
              series: mount(apis.series),
              tags: mount(apis.tags),
              sports: mount(apis.sports),
              priceHistory: mount(apis.priceHistory),
              assetPrices: mount(apis.assetPrices),
              orders: mount(apis.orders),
              portfolio: mount(apis.portfolio),
              rfqs: mount(apis.rfqs),
              combos: mount(apis.combos),
              incentives: mount(apis.incentives),
            },
            { title: "Polymarket US", description: "Polymarket US account." },
          );
        },
        { signal },
      ),
      {
        title: "Polymarket US",
        description:
          "Polymarket US (CFTC-regulated prediction markets). events, markets (order book, BBO, settlement), search, series, tags, sports, priceHistory, assetPrices: market data. orders: place, modify and cancel orders. portfolio: positions, activities, balances. rfqs, combos, incentives.",
        icons,
      },
    ),
  }),
);
