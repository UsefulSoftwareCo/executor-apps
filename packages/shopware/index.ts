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
type Fields = { shopUrl: string; clientId: string; clientSecret: string };

// Every Shopware shop has its own domain (self-hosted or Shopware Cloud). Credentials only ever go to that origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your shop URL, for example https://shop.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The shop must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the shop origin, such as https://shop.example.com, with no path.");
  return url.origin;
}

async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/api/oauth/token`, {
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

// Wraps fetch so requests to the account's shop carry a bearer token minted from its client credentials; other
// requests (such as fetching the OpenAPI document) pass through untouched.
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

const shopware = defineProvider({
  name: "Shopware",
  auth: {
    // A Shopware integration (Settings > System > Integrations) with an access key ID and secret, using the client
    // credentials grant. The shop URL is part of the account, so the provider declares no static `hosts`; the
    // router below only sends the token to the account's own origin.
    clientCredentials: secrets({
      label: "Integration access key",
      fields: object({
        shopUrl: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.shopUrl);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/api/_info/version`, { signal, headers: { Accept: "application/json" } });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: `${origin}:${account.fields.clientId}`, displayName: new URL(origin).host } };
  },
});

export default defineApp(
  { user: { accounts: { shopware: shopware.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.shopware ?? [],
        (account) => {
          const origin = originOf(account.fields.shopUrl);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api`,
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
        title: "Shopware",
        description:
          "Shopware 6 Admin API: products, orders, customers, categories, media, stock, promotions, shipping and payment methods, CMS, sales channels and generic entity search and sync.",
        instructions:
          "List and search tools use Shopware's criteria object (filter, sort, limit, page, associations, includes). Writes can be batched with the sync endpoint. What a call may do depends on the ACL privileges of the integration.",
        icons,
      },
    ),
  }),
);
