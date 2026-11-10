import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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
import { airtimeOptions, giftcardsOptions, utilitiesOptions } from "./openapi.js";

type Product = "giftcards" | "airtime" | "utilities";

// Reloadly issues one access token per product and environment: the token request names the product's API URL as
// its `audience`, and the API only accepts a token minted for its own audience. Requests are versioned by their
// Accept header. Sandbox uses the same paths on `-sandbox` hosts.
const products: Record<Product, { host: string; accept: string }> = {
  giftcards: { host: "giftcards", accept: "application/com.reloadly.giftcards-v1+json" },
  airtime: { host: "topups", accept: "application/com.reloadly.topups-v1+json" },
  utilities: { host: "utilities", accept: "application/com.reloadly.utilities-v1+json" },
};

const authUrl = "https://auth.reloadly.com/oauth/token";

function origin(product: Product, environment: string): string {
  const env = environment.trim().toLowerCase();
  if (env !== "production" && env !== "sandbox") throw new Error('Environment must be "production" or "sandbox".');
  const host = products[product].host;
  return `https://${host}${env === "sandbox" ? "-sandbox" : ""}.reloadly.com`;
}

type Fields = { clientId: string; clientSecret: string; environment: string };
type Fetch = typeof fetch;

function tokens(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const cache = new Map<string, { token: string; expires: number }>();
  return async (product: Product, fresh = false): Promise<string> => {
    const audience = origin(product, fields.environment);
    const hit = cache.get(audience);
    if (!fresh && hit !== undefined && hit.expires > Date.now()) return hit.token;
    const response = await fetcher(authUrl, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: fields.clientId,
        client_secret: fields.clientSecret,
        grant_type: "client_credentials",
        audience,
      }),
    });
    const body = await decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
    // expires_in is seconds; 900 is ms with a 90% refresh margin.
    cache.set(audience, { token: body.access_token, expires: Date.now() + (body.expires_in ?? 3600) * 900 });
    return body.access_token;
  };
}

// Wraps fetch so each Reloadly API request carries a token minted for its own host and its versioned Accept header.
function reloadlyFetch(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined): Fetch {
  const token = tokens(fields, fetcher, signal);
  const productOf = (url: URL): Product | undefined =>
    (Object.keys(products) as Product[]).find((p) => url.origin === origin(p, fields.environment));
  const wrapped = async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    const product = productOf(new URL(request.url));
    if (product === undefined) return fetcher(request);
    const send = async (fresh: boolean) => {
      const next = request.clone();
      next.headers.set("Authorization", `Bearer ${await token(product, fresh)}`);
      const accept = next.headers.get("Accept");
      if (accept === null || accept === "*/*" || accept === "application/json") next.headers.set("Accept", products[product].accept);
      return fetcher(next);
    };
    const response = await send(false);
    if (response.status !== 401) return response;
    // A revoked or rotated token: mint a new one and retry once.
    return send(true);
  };
  return wrapped as Fetch;
}

const reloadly = defineProvider({
  name: "Reloadly",
  hosts: [
    "auth.reloadly.com",
    "giftcards.reloadly.com",
    "giftcards-sandbox.reloadly.com",
    "topups.reloadly.com",
    "topups-sandbox.reloadly.com",
    "utilities.reloadly.com",
    "utilities-sandbox.reloadly.com",
  ],
  auth: {
    // Dashboard > Developers > API Settings: client ID and client secret. Sandbox and production share credentials
    // only when the dashboard says so; pick the environment the credentials were created for.
    apiCredentials: secrets({
      label: "Client ID, client secret and environment",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
        environment: plain(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const wrapped = reloadlyFetch(account.fields, fetch, signal);
    const response = await wrapped(`${origin("giftcards", account.fields.environment)}/accounts/balance`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, object({ currencyCode: string() }));
    return { accountInfo: { externalId: account.fields.clientId, displayName: `Reloadly ${account.fields.environment}` } };
  },
});

export default defineApp(
  { user: { accounts: { reloadly: reloadly.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.reloadly ?? [],
        (account) => {
          const wrapped = reloadlyFetch(account.fields, fetch, signal);
          const mount = (product: Product, options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) => {
            const base = origin(product, account.fields.environment);
            return withApprovals(
              liveOpenapiRouter({ ...options, allowedOrigin: base, baseUrl: base, cache, fetch: wrapped, signal, account }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          };
          return router(
            {
              giftcards: mount("giftcards", giftcardsOptions),
              airtime: mount("airtime", airtimeOptions),
              utilities: mount("utilities", utilitiesOptions),
            },
            { title: "Reloadly", description: "Reloadly account." },
          );
        },
        { signal },
      ),
      {
        title: "Reloadly",
        description:
          "Reloadly. giftcards: gift card catalog, countries, discounts, FX rates, orders and redeem codes. airtime: operators, top-ups, data bundles, promotions and transactions. utilities: billers, bill payments and transactions. Each also reads its wallet balance.",
        instructions:
          "Orders, top-ups and bill payments spend wallet funds; sandbox accounts use test funds. Look up the product or operator id first, then place the order.",
        icons,
      },
    ),
  }),
);
