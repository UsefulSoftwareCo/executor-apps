import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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
type Fields = { subdomain: string; clientId: string; clientSecret: string };

// Every OneLogin account lives at https://<subdomain>.onelogin.com. Credentials only ever go to that origin,
// and the provider's `hosts` limit them to onelogin.com as well.
function originOf(raw: string): string {
  const text = raw.trim().toLowerCase();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//.test(text) ? text : `https://${text.includes(".") ? text : `${text}.onelogin.com`}`);
  } catch {
    throw new Error("Enter your OneLogin subdomain, for example acme (acme.onelogin.com).");
  }
  if (url.protocol !== "https:") throw new Error("OneLogin must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the OneLogin subdomain, with no path.");
  if (!/^[a-z0-9][a-z0-9-]*\.onelogin\.com$/.test(url.hostname))
    throw new Error("Enter your OneLogin subdomain, for example acme (acme.onelogin.com).");
  return url.origin;
}

async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/auth/oauth2/v2/token`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${btoa(`${fields.clientId}:${fields.clientSecret}`)}`,
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Wraps fetch so requests to the account carry an access token minted from the API credentials; other requests
// (such as fetching the OpenAPI document) pass through untouched.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(origin, fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 36000) - 120, 60) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    const target = new URL(request.url);
    if (target.origin !== origin || target.pathname === "/auth/oauth2/v2/token") return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const onelogin = defineProvider({
  name: "OneLogin",
  hosts: ["*.onelogin.com"],
  auth: {
    // API credentials (Administration > Developers > API Credentials) with a scope such as Read Users or Manage All.
    clientCredentials: secrets({
      label: "API credentials",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.subdomain);
    const authed = authorizedFetch(origin, account.fields, fetch);
    // Minting the token proves the credentials. The rate-limit call proves the token works; a 403 only means the
    // credentials' scope (for example Authentication Only) does not cover it.
    const response = await authed(`${origin}/auth/rate_limit`, { signal, headers: { Accept: "application/json" } });
    if (response.status !== 403) await decodeJson(response, json());
    const host = new URL(origin).host;
    return { accountInfo: { externalId: `${host}:${account.fields.clientId}`, displayName: host } };
  },
});

export default defineApp(
  { user: { accounts: { onelogin: onelogin.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.onelogin ?? [],
        (account) => {
          const origin = originOf(account.fields.subdomain);
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
        title: "OneLogin",
        description:
          "Users, roles, groups, apps, app rules, MFA, privileges, events, branding, SAML, smart hooks and the rest of the OneLogin API.",
        instructions:
          "What a call may do depends on the scope of the API credentials (Authentication Only, Read Users, Manage Users, Read All, Manage All). List endpoints paginate with cursors or limit/page parameters as documented per operation.",
        icons,
      },
    ),
  }),
);
