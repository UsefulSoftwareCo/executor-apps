import {
  accountRouter,
  array,
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
type Fields = { instance: string; clientId: string; clientSecret: string };

// NinjaOne hosts each tenant on a regional instance (app.ninjarmm.com, us2, eu, ca, oc, ...). Credentials only ever
// go to that instance, so the host must be a ninjarmm.com name reached over https.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your NinjaOne instance host, for example app.ninjarmm.com.");
  }
  if (url.protocol !== "https:") throw new Error("The NinjaOne instance must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the NinjaOne instance host, with no path.");
  if (!/^([a-z0-9-]+\.)*ninjarmm\.com$/i.test(url.hostname))
    throw new Error("The NinjaOne instance must be a ninjarmm.com host, for example app.ninjarmm.com.");
  return url.origin;
}

async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/ws/oauth/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: fields.clientId,
      client_secret: fields.clientSecret,
      scope: "monitoring management control",
    }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Wraps fetch so requests to the account's instance carry a bearer token minted from its client credentials; other
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

const ninjaone = defineProvider({
  name: "NinjaOne RMM",
  auth: {
    // An API application of type "API Services (machine-to-machine)" (Administration > Apps > API) using the client
    // credentials grant. The instance host is part of the account, so the provider declares no static `hosts`; the
    // router below only sends the token to the account's own origin.
    clientCredentials: secrets({
      label: "API client credentials",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.instance);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/v2/organizations?pageSize=1`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, array(object({})));
    return { accountInfo: { externalId: `${origin}:${account.fields.clientId}`, displayName: new URL(origin).host } };
  },
});

export default defineApp(
  { user: { accounts: { ninjaone: ninjaone.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ninjaone ?? [],
        (account) => {
          const origin = originOf(account.fields.instance);
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
        title: "NinjaOne RMM",
        description:
          "Organizations, locations, devices, tickets, alerts, policies, scripting, patching, backup and the rest of the NinjaOne RMM public API.",
        instructions:
          "List tools page with pageSize and after (the last id of the previous page). What a call may do depends on the scopes granted to the API application (monitoring, management, control).",
        icons,
      },
    ),
  }),
);
