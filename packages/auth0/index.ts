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
type ClientFields = { domain: string; clientId: string; clientSecret: string };

// Every Auth0 tenant has a canonical domain (example.us.auth0.com). The Management API audience and the
// client-credentials token request require the canonical domain, so custom domains are rejected. Credentials
// only ever go to that origin, and the provider's `hosts` limit them to auth0.com as well.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Auth0 tenant domain, for example example.us.auth0.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Auth0 tenant must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the Auth0 tenant domain, with no path.");
  if (!url.hostname.endsWith(".auth0.com"))
    throw new Error(
      "Enter the tenant's canonical domain (for example example.us.auth0.com), not a custom domain: the Management API audience requires the canonical domain.",
    );
  return url.origin;
}

async function accessToken(origin: string, fields: ClientFields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/oauth/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: fields.clientId,
      client_secret: fields.clientSecret,
      audience: `${origin}/api/v2/`,
    }),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Wraps fetch so requests to the tenant carry a Management API token minted from the application's client
// credentials; other requests (such as fetching the OpenAPI document) pass through untouched.
function authorizedFetch(origin: string, fields: ClientFields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(origin, fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 86400) - 120, 60) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    const target = new URL(request.url);
    if (target.origin !== origin || target.pathname === "/oauth/token") return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const auth0 = defineProvider({
  name: "Auth0",
  // Canonical tenant domains are <tenant>.auth0.com or <tenant>.<region>.auth0.com; a wildcard covers one level.
  hosts: ["*.auth0.com", ...["us", "eu", "au", "jp", "uk", "ca", "sg"].map((r) => `*.${r}.auth0.com`)],
  auth: {
    // A Machine to Machine application authorized for the Auth0 Management API (Applications > APIs > Auth0
    // Management API > Machine to Machine Applications). The router below also only sends tokens to the
    // account's own origin.
    clientCredentials: secrets({
      label: "Machine to Machine application",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
    // A Management API access token, for example the short-lived one on the API Explorer tab of the Auth0
    // Management API in the dashboard.
    token: secrets({
      label: "Management API access token",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.domain);
    const authed =
      account.method === "clientCredentials" ? authorizedFetch(origin, account.fields, fetch) : fetch;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (account.method === "token") headers.Authorization = `Bearer ${account.fields.token}`;
    const response = await authed(`${origin}/api/v2/clients?per_page=1&fields=client_id`, { signal, headers });
    // A 403 insufficient_scope means the credentials are valid but lack read scopes for clients; that is fine.
    // (Client-credentials accounts have already minted a token by now, which proves the secret.)
    if (response.status === 403) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (body.error !== "insufficient_scope") throw new Error("Auth0 refused the credentials (403).");
    } else {
      await decodeJson(response, json());
    }
    const host = new URL(origin).host;
    return {
      accountInfo: {
        externalId: account.method === "clientCredentials" ? `${host}:${account.fields.clientId}` : host,
        displayName: host,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { auth0: auth0.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.auth0 ?? [],
        (account) => {
          const origin = originOf(account.fields.domain);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api/v2`,
              cache,
              fetch: account.method === "clientCredentials" ? authorizedFetch(origin, account.fields, fetch) : fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Auth0",
        description:
          "Users, roles, organizations, applications, connections, actions, logs, tenant settings and the rest of the Auth0 Management API.",
        instructions:
          "What a call may do depends on the scopes granted to the Machine to Machine application (or token). List endpoints paginate with page and per_page, or checkpoint pagination (from, take) where noted.",
        icons,
      },
    ),
  }),
);
