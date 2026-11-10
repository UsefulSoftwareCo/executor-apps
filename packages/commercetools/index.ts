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
import { apiOrigin, authOrigin, options, regions } from "./openapi.js";

type Fetch = typeof fetch;
type Fields = { region: string; projectKey: string; clientId: string; clientSecret: string };

function regionOf(fields: Fields): string {
  const region = fields.region.trim();
  if (!(regions as readonly string[]).includes(region))
    throw new Error(`The commercetools region must be one of ${regions.join(", ")}.`);
  return region;
}

function projectKeyOf(fields: Fields): string {
  const key = fields.projectKey.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(key)) throw new Error("The commercetools project key has letters, digits, - and _ only.");
  return key;
}

// OAuth 2.0 client-credentials grant against the region's auth service, client id and secret as Basic credentials.
// The scope is left out, so the token carries every scope the API client was created with.
async function accessToken(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const basic = btoa(`${fields.clientId}:${fields.clientSecret}`);
  const response = await fetcher(`${authOrigin(regionOf(fields))}/oauth/token`, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Requests to the account's API host carry the minted bearer token; the token is cached until shortly before expiry.
function authorizedFetch(fields: Fields, fetcher: Fetch): Fetch {
  const origin = apiOrigin(regionOf(fields));
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 120, 30) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const commercetools = defineProvider({
  name: "commercetools",
  hosts: [
    ...regions.map((region) => `api.${region}.commercetools.com`),
    ...regions.map((region) => `auth.${region}.commercetools.com`),
  ],
  auth: {
    // An API client created in the Merchant Center (Settings > Developer settings > Create new API client).
    // The token endpoint depends on the region, so the client is exchanged here rather than by the connect page.
    apiClient: secrets({
      label: "API client",
      fields: object({
        region: plain(string({ minLength: 1 })),
        projectKey: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const projectKey = projectKeyOf(account.fields);
    const authed = authorizedFetch(account.fields, fetch);
    const response = await authed(`${apiOrigin(regionOf(account.fields))}/${projectKey}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    const project = await decodeJson(response, object({ key: string(), name: string() }));
    return { accountInfo: { externalId: project.key, displayName: project.name } };
  },
});

export default defineApp(
  { user: { accounts: { commercetools: commercetools.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.commercetools ?? [],
        (account) => {
          const origin = apiOrigin(regionOf(account.fields));
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: origin,
              cache,
              fetch: authorizedFetch(account.fields, fetch),
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "commercetools",
        description:
          "Carts, orders, customers, products, categories, prices, inventory, discounts, shipping, payments and the rest of the commercetools Composable Commerce HTTP API.",
        instructions:
          "Every operation takes the project key as its first path argument; use the connected account's project key. What a call may do depends on the scopes of the API client; a 403 means the client lacks a scope.",
        icons,
      },
    ),
  }),
);
