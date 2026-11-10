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
type Fields = { serverUrl: string; userApiToken: string };

// Every N-central server has its own hostname (ncentral.example.com). Credentials only ever go to that origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your N-central server hostname, for example ncentral.example.com.");
  }
  if (url.protocol !== "https:") throw new Error("The N-central server must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the N-central server hostname, with no path.");
  return url.origin;
}

const tokenResponse = object({ tokens: object({ access: object({ token: string(), expirySeconds: number().optional() }) }) });

// POST /api/auth/authenticate exchanges the long-lived User-API token (JWT) for a one-hour access token.
async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/api/auth/authenticate`, {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${fields.userApiToken}`, Accept: "application/json" },
  });
  return (await decodeJson(response, tokenResponse)).tokens.access;
}

// Wraps fetch so requests to the account's server carry an access token minted from its User-API token; other
// requests pass through untouched.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(origin, fields, fetcher, signal);
    cached = { token: t.token, expires: Date.now() + Math.max((t.expirySeconds ?? 3600) - 120, 60) * 1000 };
    return t.token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const ncentral = defineProvider({
  name: "N-able N-central",
  auth: {
    // The server hostname is part of the account, so the provider declares no static `hosts`; the router below
    // only sends tokens to the account's own origin.
    userApiToken: secrets({
      label: "User-API token",
      fields: object({
        serverUrl: plain(string({ minLength: 1 })),
        userApiToken: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.serverUrl);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/api/auth/validate`, { signal, headers: { Accept: "application/json" } });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: origin, displayName: new URL(origin).host } };
  },
});

export default defineApp(
  { user: { accounts: { ncentral: ncentral.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ncentral ?? [],
        (account) => {
          const origin = originOf(account.fields.serverUrl);
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
        title: "N-able N-central",
        description:
          "Service organizations, customers, sites, devices, active issues, custom properties, scheduled tasks, maintenance windows, users and access groups in N-able N-central.",
        instructions:
          "Paged lists accept pageNumber (from 1) and pageSize (1 to 1000, default 50) plus sortBy and sortOrder. Organization units form a tree: service organizations contain customers, customers contain sites. Several endpoints are marked preview by N-able and depend on the N-central version; what a call may do depends on the roles and access groups of the API user.",
        icons,
      },
    ),
  }),
);
