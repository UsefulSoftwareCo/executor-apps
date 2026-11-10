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
import { apis, prefixes } from "./openapi.js";

type Fetch = typeof fetch;
type Fields = { region: string; clientId: string; clientSecret: string };

const regionPattern = /^[a-z]{2}-[a-z]+-[1-9]$/;

// Every Gainsight CC community lives in one AWS region (eu-west-1, us-west-2...); credentials only ever go to
// that region's api2 host.
function originOf(account: { fields: { region: string } }): string {
  const region = account.fields.region.trim().toLowerCase();
  if (!regionPattern.test(region)) throw new Error("Enter your Gainsight region, for example eu-west-1 or us-west-2.");
  return `https://api2-${region}.insided.com`;
}

async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/oauth2/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: fields.clientId,
      client_secret: fields.clientSecret,
      scope: "read write",
    }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Wraps fetch so requests to the account's API host carry a bearer token minted from its client credentials;
// other requests (such as fetching an OpenAPI document) pass through untouched.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(origin, fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 7200) - 120, 60) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const gainsightCc = defineProvider({
  name: "Gainsight CC",
  hosts: ["*.insided.com"],
  auth: {
    // API credentials from Control > Integrations > API, using the client credentials grant. The region is
    // part of the token URL, so the grant is performed in code rather than with the framework's oauth2 method.
    clientCredentials: secrets({
      label: "API client credentials",
      fields: object({
        region: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  // The categories list is readable with the read scope, so it checks both the credentials and the region.
  async health({ account, fetch, signal }) {
    const origin = originOf(account);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/v2/categories`, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Gainsight CC rejected the credentials (HTTP ${response.status}).`);
    return {
      accountInfo: {
        externalId: `${origin}:${account.fields.clientId}`,
        displayName: `${account.fields.region.trim()} (${account.fields.clientId})`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { gainsightCc: gainsightCc.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.gainsightCc ?? [],
        (account) => {
          const origin = originOf(account);
          const authed = authorizedFetch(origin, account.fields, fetch);
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(
              liveOpenapiRouter({
                ...options,
                allowedOrigin: origin,
                baseUrl: `${origin}${prefixes.get(options) ?? ""}`,
                cache,
                fetch: authed,
                signal,
                account,
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          return router(
            {
              community: mount(apis.community),
              user: mount(apis.user),
              events: mount(apis.events),
              search: mount(apis.search),
              gamification: mount(apis.gamification),
            },
            { title: "Gainsight CC", description: "Gainsight Customer Communities community." },
          );
        },
        { signal },
      ),
      {
        title: "Gainsight CC",
        description:
          "Gainsight Customer Communities (inSided). community: topics, questions, articles, ideas, conversations, product updates, categories, replies, moderation. user: user accounts, roles, profile fields, badges. events: community events. search: search and external content indexing. gamification: badges.",
        icons,
      },
    ),
  }),
);
