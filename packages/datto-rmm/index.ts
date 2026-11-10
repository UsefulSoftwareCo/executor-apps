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
type Fields = { platform: string; apiKey: string; apiSecretKey: string };

// Each Datto RMM account lives on one platform host: https://<platform>-api.centrastage.net.
function originOf(raw: string): string {
  const match = /^(?:https?:\/\/)?([a-z0-9]+)(?:-api\.centrastage\.net)?(?:\/.*)?$/.exec(raw.trim().toLowerCase());
  if (match === null) throw new Error("Enter the platform name, for example merlot (merlot-api.centrastage.net).");
  return `https://${match[1]}-api.centrastage.net`;
}

// Datto's documented flow: the API key and secret are the username and password of a password grant,
// sent with the public client credentials public:public.
async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/auth/oauth/token`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${btoa("public-client:public")}`,
    },
    body: new URLSearchParams({
      grant_type: "password",
      username: fields.apiKey,
      password: fields.apiSecretKey,
    }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Requests to the account's platform host carry the minted token; others (the OpenAPI document) pass through.
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
    if (new URL(request.url).pathname.startsWith("/auth/")) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const dattoRmm = defineProvider({
  name: "Datto RMM",
  hosts: ["*.centrastage.net"],
  auth: {
    // Generated in Datto RMM under Setup > Global Settings > Access Control > Enable API Access, then the
    // user's Security tab (Generate API Keys). Datto offers no OAuth app registration.
    apiKey: secrets({
      label: "API key and secret",
      fields: object({
        platform: plain(string({ minLength: 1 })),
        apiKey: plain(string({ minLength: 1 })),
        apiSecretKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.platform);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/api/v2/account`, { signal, headers: { Accept: "application/json" } });
    const me = await decodeJson(response, object({ uid: string(), name: string() }));
    return { accountInfo: { externalId: `${origin}:${me.uid}`, displayName: me.name } };
  },
});

export default defineApp(
  { user: { accounts: { dattoRmm: dattoRmm.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.dattoRmm ?? [],
        (account) => {
          const origin = originOf(account.fields.platform);
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
        title: "Datto RMM",
        description:
          "Datto RMM sites, devices, alerts, jobs, audits, patches, variables, users and account settings through the Datto RMM API v2.",
        instructions:
          "List endpoints are paginated (page, max). The API is rate limited per account; /v2/system/request_rate reports usage.",
        icons,
      },
    ),
  }),
);
