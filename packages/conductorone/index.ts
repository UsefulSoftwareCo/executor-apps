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
type Fields = { domain: string; clientId: string; clientSecret: string };

// Every ConductorOne tenant lives on its own host (acme.conductor.one); the same host appears in the client ID
// (<id>@acme.conductor.one/pcc). Credentials only ever go to that origin, and `hosts` limits them to conductor.one.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your ConductorOne tenant hostname, for example acme.conductor.one.");
  }
  if (url.protocol !== "https:") throw new Error("The ConductorOne tenant must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the tenant hostname, with no path.");
  if (!url.hostname.endsWith(".conductor.one"))
    throw new Error("Enter the tenant hostname from your client ID, for example acme.conductor.one.");
  return url.origin;
}

// The token endpoint requires the client credentials in the form body, not in a Basic header.
async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/auth/v1/token`, {
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

// Wraps fetch so requests to the tenant carry a token minted from the client credentials; other requests (such as
// fetching the OpenAPI document) pass through untouched.
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
    const target = new URL(request.url);
    if (target.origin !== origin || target.pathname === "/auth/v1/token") return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const conductorone = defineProvider({
  name: "ConductorOne",
  hosts: ["*.conductor.one"],
  auth: {
    // A client ID and secret created under AI & API (formerly API Keys) in the ConductorOne web app.
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
    const response = await authed(`${origin}/api/v1/auth/introspect`, { signal, headers: { Accept: "application/json" } });
    await decodeJson(response, json());
    const host = new URL(origin).host;
    return { accountInfo: { externalId: `${host}:${account.fields.clientId}`, displayName: host } };
  },
});

export default defineApp(
  { user: { accounts: { conductorone: conductorone.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.conductorone ?? [],
        (account) => {
          const origin = originOf(account.fields.domain);
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
        title: "ConductorOne",
        description:
          "Apps, entitlements, access requests, access reviews, policies, users, groups, tasks, automations and the rest of the ConductorOne (C1) API.",
        instructions:
          "What a call may do depends on the roles of the service principal that owns the client credentials. List endpoints paginate with page_size and page_token.",
        icons,
      },
    ),
  }),
);
