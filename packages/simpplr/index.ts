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
import { options, regions } from "./openapi.js";

type Fetch = typeof fetch;
type Fields = { region: string; clientId: string; clientSecret: string };

// Each tenant lives in one region (app = United States, eu, au, ca) with its own platform host. Credentials only
// ever go to that host.
function originOf(region: string): string {
  const key = region.trim().toLowerCase();
  if (!(regions as readonly string[]).includes(key))
    throw new Error("Region must be one of app (United States), eu, au or ca.");
  return `https://platform.${key}.simpplr.com`;
}

async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  // The default scope is read; "everything" also allows the create, update and delete tools.
  const response = await fetcher(`${origin}/v1/identity/oauth/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: fields.clientId,
      client_secret: fields.clientSecret,
      scope: "everything",
    }),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Wraps fetch so requests to the account's regional host carry a bearer token minted from its client credentials.
// Simpplr's token response has no expiry field (the token is a JWT), so tokens are renewed every 10 minutes and
// again on demand.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(origin, fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.min((t.expires_in ?? 600) * 1000, 600_000) };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const simpplr = defineProvider({
  name: "Simpplr",
  auth: {
    // A Simpplr client application (Client ID and secret) using the client credentials grant. The region is part
    // of the account, so the provider declares no static `hosts`; the router below only sends the token to the
    // account's own regional host.
    clientCredentials: secrets({
      label: "Client application credentials",
      fields: object({
        region: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.region);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/v1/b2b/identity/test`, { signal, headers: { Accept: "application/json" } });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: `${origin}:${account.fields.clientId}`, displayName: `Simpplr (${account.fields.region})` } };
  },
});

export default defineApp(
  { user: { accounts: { simpplr: simpplr.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.simpplr ?? [],
        (account) => {
          const origin = originOf(account.fields.region);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/v1`,
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
        title: "Simpplr",
        description:
          "Manage a Simpplr intranet: sites, pages, events, albums, feeds, comments, audiences, tasks, people attributes, files and analytics exports.",
        icons,
      },
    ),
  }),
);
