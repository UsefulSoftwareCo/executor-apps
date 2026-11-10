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
import { assetsOptions, leadsOptions, usersOptions } from "./openapi.js";

type Fetch = typeof fetch;
type Fields = { domain: string; clientId: string; clientSecret: string };

// A Marketo instance is reached at <munchkin-id>.mktorest.com (Admin > Web Services > REST API > Endpoint). The
// token request carries the client secret, so credentials only ever go to that origin and the provider's `hosts`
// also limit them to mktorest.com.
function originOf(raw: string): string {
  let text = raw.trim();
  text = text.replace(/\/(rest|identity)\/?$/i, "").replace(/\/+$/, "");
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your Marketo REST host, for example 123-ABC-456.mktorest.com.");
  }
  if (url.protocol !== "https:") throw new Error("Marketo must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the Marketo host (for example 123-ABC-456.mktorest.com), with no path.");
  if (!url.hostname.endsWith(".mktorest.com"))
    throw new Error("Enter the Marketo REST host from Admin > Web Services, for example 123-ABC-456.mktorest.com.");
  return url.origin;
}

async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const query = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: fields.clientId,
    client_secret: fields.clientSecret,
  });
  const response = await fetcher(`${origin}/identity/oauth/token?${query}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number() }));
}

// Wraps fetch so requests to the account's origin carry an access token minted from the LaunchPoint service's
// client credentials; other requests (such as fetching the Swagger documents) pass through untouched.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(origin, fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in - 60) * 1000, 30_000) };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    const target = new URL(request.url);
    if (target.origin !== origin || target.pathname === "/identity/oauth/token") return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const marketo = defineProvider({
  name: "Marketo",
  hosts: ["*.mktorest.com"],
  auth: {
    // The Client ID and Client Secret of a LaunchPoint "Custom" service (Admin > Integration > LaunchPoint) owned
    // by an API-only user, plus the REST host from Admin > Integration > Web Services.
    clientCredentials: secrets({
      label: "LaunchPoint client credentials",
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
    // Minting the token proves the credentials; describing leads needs only read access to the lead database.
    const response = await authed(`${origin}/rest/v1/leads/describe.json`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, json());
    const host = new URL(origin).host;
    return { accountInfo: { externalId: `${host}:${account.fields.clientId}`, displayName: host } };
  },
});

export default defineApp(
  { user: { accounts: { marketo: marketo.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.marketo ?? [],
        (account) => {
          const origin = originOf(account.fields.domain);
          const authed = authorizedFetch(origin, account.fields, fetch);
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(
              liveOpenapiRouter({
                ...options,
                allowedOrigin: origin,
                baseUrl: origin,
                cache,
                fetch: authed,
                signal,
                account,
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          return router(
            { leads: mount(leadsOptions), assets: mount(assetsOptions), users: mount(usersOptions) },
            { title: "Marketo", description: "Marketo Engage instance." },
          );
        },
        { signal },
      ),
      {
        title: "Marketo",
        description:
          "Adobe Marketo Engage. leads: leads, companies, opportunities, lists, programs, campaigns, activities, custom objects, bulk exports and imports. assets: emails, forms, landing pages, files, folders, programs, tokens, snippets, tags and channels. users: user management (users, roles, workspaces).",
        instructions:
          "Marketo reports most errors with HTTP 200 and `success: false` plus an `errors` array; check it. Calls count against the instance's daily quota (50,000 by default) and a 100 calls per 20 seconds limit. List endpoints page with `nextPageToken`; get one from the paging token endpoint.",
        icons,
      },
    ),
  }),
);
