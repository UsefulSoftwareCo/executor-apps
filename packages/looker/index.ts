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
type Fields = { host: string; clientId: string; clientSecret: string };

// Looker instances live at <name>.cloud.looker.com / <name>.looker.com, or <name>.looker.app on Google Cloud
// core. Credentials only ever go to the account's own origin, and the provider's `hosts` limit them as well.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Looker instance hostname, for example mycompany.cloud.looker.com.");
  }
  if (url.protocol !== "https:") throw new Error("The Looker instance must be reached over https.");
  if (url.pathname.replace(/\/+$/, "") !== "" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the Looker instance hostname, with no path.");
  if (!/\.looker\.(com|app)$/.test(url.hostname))
    throw new Error("Enter a Looker-hosted instance hostname ending in .looker.com or .looker.app.");
  return url.origin;
}

async function login(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/api/4.0/login`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ client_id: fields.clientId, client_secret: fields.clientSecret }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Wraps fetch so requests to the instance carry an access token minted from the API credentials; other
// requests (such as fetching the OpenAPI document) pass through untouched.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await login(origin, fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 120, 30) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    const target = new URL(request.url);
    if (target.origin !== origin || target.pathname === "/api/4.0/login") return fetcher(request);
    request.headers.set("Authorization", `token ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const looker = defineProvider({
  name: "Looker",
  hosts: ["*.looker.com", "*.cloud.looker.com", "*.looker.app"],
  auth: {
    // API credentials created for a user on Admin > Users > Edit > API Keys.
    apiCredentials: secrets({
      label: "API client credentials",
      fields: object({
        host: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.host);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/api/4.0/user?fields=id`, {
      signal,
      headers: { Accept: "application/json" },
    });
    const me = await decodeJson(response, object({ id: string() }));
    return {
      accountInfo: {
        externalId: `${new URL(origin).host}:${me.id}`,
        displayName: new URL(origin).host,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { looker: looker.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.looker ?? [],
        (account) => {
          const origin = originOf(account.fields.host);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api/4.0`,
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
        title: "Looker",
        description:
          "Looks, dashboards, queries, LookML models and explores, users, groups, roles, scheduled plans, connections and the rest of the Looker API 4.0.",
        instructions:
          "Acts as the user the API credentials belong to, so access follows that user's roles and permission sets.",
        icons,
      },
    ),
  }),
);
