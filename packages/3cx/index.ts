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
type Fields = { domain: string; clientId: string; clientSecret: string };

// Every 3CX system has its own FQDN (pbx.example.com, or example.3cx.us for hosted systems). Credentials only
// ever go to that origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your 3CX domain, for example pbx.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The 3CX system must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the 3CX domain, with no path.");
  return url.origin;
}

async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/connect/token`, {
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

// Wraps fetch so requests to the account's PBX carry a bearer token minted from its client credentials; other
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

const threecx = defineProvider({
  name: "3CX",
  auth: {
    // A 3CX API application (Admin Console > Integrations > API) with client ID and secret, using the client
    // credentials grant. The PBX domain is part of the account, so the provider declares no static `hosts`; the
    // router below only sends the token to the account's own origin.
    clientCredentials: secrets({
      label: "API client credentials",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.domain);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/xapi/v1/Defaults`, { signal, headers: { Accept: "application/json" } });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: `${origin}:${account.fields.clientId}`, displayName: new URL(origin).host } };
  },
});

export default defineApp(
  { user: { accounts: { threecx: threecx.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.threecx ?? [],
        (account) => {
          const origin = originOf(account.fields.domain);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/xapi/v1`,
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
        title: "3CX",
        description:
          "Users, extensions, queues, trunks, active calls, call history, contacts, parking, settings and the rest of the 3CX XAPI.",
        instructions:
          "The API is OData: list tools accept $top, $skip, $filter, $orderby, $select and $expand. What a call may do depends on the role of the API application in the 3CX Admin Console.",
        icons,
      },
    ),
  }),
);
