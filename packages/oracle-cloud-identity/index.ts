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

// An identity domain is served from https://idcs-<32 hex>.identity.oraclecloud.com. Credentials only ever go to
// that origin, and the provider's `hosts` limit them to identity.oraclecloud.com as well.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your identity domain URL, for example https://idcs-<32 hex digits>.identity.oraclecloud.com.");
  }
  if (url.protocol !== "https:") throw new Error("The identity domain must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the identity domain URL, with no path.");
  if (!/^idcs-[a-f0-9]{32}\.identity\.oraclecloud\.com$/i.test(url.hostname))
    throw new Error("Enter the identity domain URL, for example idcs-1234567890abcdef1234567890abcdef.identity.oraclecloud.com.");
  return url.origin;
}

// Client credentials with the application's own scopes: the token carries the app roles granted to the client.
async function accessToken(origin: string, fields: ClientFields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const basic = btoa(`${fields.clientId}:${fields.clientSecret}`);
  const response = await fetcher(`${origin}/oauth2/v1/token`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "urn:opc:idm:__myscopes__" }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Wraps fetch so requests to the identity domain carry a bearer token minted from the client's credentials;
// other requests (such as fetching the Swagger document) pass through untouched, as do the OAuth endpoints that
// take a client's own credentials (token, introspect, revoke).
const clientAuthenticated = new Set(["/oauth2/v1/token", "/oauth2/v1/introspect", "/oauth2/v1/revoke"]);
function authorizedFetch(origin: string, fields: ClientFields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(origin, fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 120, 60) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    const target = new URL(request.url);
    // Swap the minted token in where the operation asks for the account (openapi.ts fills the scheme with the
    // client secret); public operations go without it.
    const asked = request.headers.get("Authorization") === `Bearer ${fields.clientSecret}`;
    if (target.origin !== origin || clientAuthenticated.has(target.pathname) || !asked) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const oracleCloudIdentity = defineProvider({
  name: "Oracle Cloud Identity",
  hosts: ["*.identity.oraclecloud.com"],
  auth: {
    // A confidential application in the identity domain with the Client Credentials grant and an Identity
    // Domain Administrator (or narrower) app role (Integrated applications > Add application > Confidential).
    clientCredentials: secrets({
      label: "Confidential application (client credentials)",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
    // An access token minted elsewhere (for example a short-lived one from the application's token endpoint).
    token: secrets({
      label: "Access token",
      fields: object({
        domain: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.domain);
    // A client-credentials account mints its token here: authorizedFetch swaps one in only for operations
    // whose security asks for the account.
    const bearer =
      account.method === "clientCredentials"
        ? (await accessToken(origin, account.fields, fetch, signal)).access_token
        : account.fields.token;
    const response = await fetch(`${origin}/admin/v1/Users?count=1&attributes=id`, {
      signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${bearer}` },
    });
    // 403 means the token is valid but its app role cannot list users.
    if (response.status !== 403) await decodeJson(response, json());
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
  { user: { accounts: { oracleCloudIdentity: oracleCloudIdentity.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.oracleCloudIdentity ?? [],
        (account) => {
          const origin = originOf(account.fields.domain);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: origin,
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
        title: "Oracle Cloud Identity",
        description:
          "Oracle Cloud Identity (IDCS and OCI IAM identity domains): users, groups, applications, app roles, identity providers, policies, MFA settings, audit events and the rest of the SCIM-based admin API.",
        instructions:
          "Search endpoints are POST .../.search (they only read, but as POSTs they ask for approval). What a call may do depends on the app roles granted to the confidential application (or token). List endpoints paginate with startIndex and count.",
        icons,
      },
    ),
  }),
);
