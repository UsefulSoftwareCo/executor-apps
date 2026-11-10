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
import { options } from "./openapi.js";

type Fetch = typeof fetch;
type Fields = { baseUrl: string; clientId: string; clientSecret: string };

// Zuora tenants live on regional REST hosts (rest.zuora.com, rest.na.zuora.com, rest.eu.zuora.com, the sandbox
// hosts...). Credentials only ever go to the account's own Zuora origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Zuora REST base URL, for example https://rest.zuora.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Zuora endpoint must use https.");
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.zuora\.com$/i.test(url.hostname) || url.port !== "")
    throw new Error("The Zuora endpoint must be a zuora.com REST host such as https://rest.zuora.com.");
  if (url.pathname.replace(/\/+$/, "") !== "" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the Zuora REST host, with no path.");
  return url.origin;
}

async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/oauth/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: fields.clientId,
      client_secret: fields.clientSecret,
    }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Requests to the account's origin carry a bearer token minted from its client credentials; others pass through.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(origin, fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 120, 60) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const zuora = defineProvider({
  name: "Zuora",
  auth: {
    // A Zuora OAuth client (Administration > Users > the user's OAuth Clients) using the client credentials grant.
    clientCredentials: secrets({
      label: "OAuth client credentials",
      fields: object({
        baseUrl: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.baseUrl);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/v1/catalog/products?pageSize=1`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: `${origin}:${account.fields.clientId}`, displayName: new URL(origin).host } };
  },
});

export default defineApp(
  { user: { accounts: { zuora: zuora.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.zuora ?? [],
        (account) => {
          const origin = originOf(account.fields.baseUrl);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: origin,
              cache,
              fetch: authorizedFetch(origin, account.fields, fetch),
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Zuora",
        description:
          "Zuora subscription billing: accounts, subscriptions, orders, invoices, payments, usage, product catalog, credit memos and the rest of the Zuora REST API.",
        icons,
      },
    ),
  }),
);
