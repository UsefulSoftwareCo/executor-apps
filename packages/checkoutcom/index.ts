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
type Environment = "sandbox" | "production";
type Target = { environment: Environment; prefix: string };
type ClientFields = { environment: string; prefix: string; clientId: string; clientSecret: string; scopes: string };

const prefixPattern = /^[a-z0-9]{3,30}$/;

// Every Checkout.com account has its own hosts: https://<prefix>.api.checkout.com (live) or
// https://<prefix>.api.sandbox.checkout.com (sandbox), and the OAuth token server at
// https://<prefix>.access.checkout.com/connect/token (or .access.sandbox.checkout.com).
function targetOf(fields: { environment: string; prefix: string }): Target {
  const environment = fields.environment.trim().toLowerCase();
  if (environment !== "sandbox" && environment !== "production") throw new Error("Environment must be sandbox or production.");
  const prefix = fields.prefix.trim().toLowerCase();
  if (!prefixPattern.test(prefix)) {
    throw new Error("Enter the unique URL prefix from Dashboard > Developers > Overview > API URLs, for example 1a2b3c4d.");
  }
  return { environment, prefix };
}

const apiOrigin = (t: Target) =>
  t.environment === "sandbox" ? `https://${t.prefix}.api.sandbox.checkout.com` : `https://${t.prefix}.api.checkout.com`;
const tokenOrigin = (t: Target) =>
  t.environment === "sandbox" ? `https://${t.prefix}.access.sandbox.checkout.com` : `https://${t.prefix}.access.checkout.com`;

async function accessToken(fields: ClientFields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${tokenOrigin(targetOf(fields))}/connect/token`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${btoa(`${fields.clientId}:${fields.clientSecret}`)}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: fields.scopes.trim() }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Wraps fetch so requests to the account's API host carry a token minted from the access key; other requests
// (such as fetching the OpenAPI document) pass through untouched.
function authorizedFetch(origin: string, fields: ClientFields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 60, 30) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const checkout = defineProvider({
  name: "Checkout.com",
  hosts: ["*.api.checkout.com", "*.api.sandbox.checkout.com", "*.access.checkout.com", "*.access.sandbox.checkout.com"],
  auth: {
    secretKey: secrets({
      label: "Environment, URL prefix and secret API key",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        prefix: plain(string({ minLength: 1 })),
        secretKey: string({ minLength: 1 }),
      }),
    }),
    // OAuth client credentials (an access key ID and secret). Checkout.com's token server is per account and
    // environment, so the connection form carries both and the token is minted here.
    clientCredentials: secrets({
      label: "Environment, URL prefix, access key and scopes",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        prefix: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
        scopes: plain(string({ minLength: 1 })),
      }),
    }),
  },
  // Listing workflows is read-only but needs the flow scope. A 403 means the credentials were accepted but lack
  // that scope, which is fine. Client-credentials accounts have already minted a token by then.
  async health({ account, fetch, signal }) {
    const target = targetOf(account.fields);
    const origin = apiOrigin(target);
    const authed = account.method === "clientCredentials" ? authorizedFetch(origin, account.fields, fetch) : fetch;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (account.method === "secretKey") headers.Authorization = `Bearer ${account.fields.secretKey}`;
    const response = await authed(`${origin}/workflows`, { signal, headers });
    if (response.status !== 403) await decodeJson(response, object({ data: json() }));
    return {
      accountInfo: {
        externalId: `${target.environment}:${target.prefix}`,
        displayName: `Checkout.com ${target.environment} (${target.prefix})`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { checkout: checkout.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.checkout ?? [],
        (account) => {
          const base = apiOrigin(targetOf(account.fields));
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: base,
              baseUrl: base,
              cache,
              fetch: account.method === "clientCredentials" ? authorizedFetch(base, account.fields, fetch) : fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Checkout.com",
        description:
          "Checkout.com payments: payments, captures, refunds and voids, payment sessions and links, instruments, customers, disputes, balances, workflows, payouts, forex and sub-entities.",
        icons,
      },
    ),
  }),
);
