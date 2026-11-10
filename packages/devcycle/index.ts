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

const TOKEN_URL = "https://auth.devcycle.com/oauth/token";
const AUDIENCE = "https://api.devcycle.com/";
const Token = object({ access_token: string(), expires_in: number().optional() });

type Fetch = typeof fetch;
type Fields = { clientId: string; clientSecret: string };

// DevCycle's Auth0 tenant needs an `audience` parameter on the client-credentials exchange,
// which the generic oauth2 grant cannot send, so the token is exchanged here.
function tokenSource(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  let cached: { token: string; expires: number } | undefined;
  return async () => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const response = await fetcher(TOKEN_URL, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        audience: AUDIENCE,
        client_id: fields.clientId,
        client_secret: fields.clientSecret,
      }).toString(),
    });
    const t = await decodeJson(response, Token);
    // 86400 default lifetime is assumed (not stated in vendor docs). expires_in is seconds; * 900 is ms with a 10% refresh margin.
    cached = { token: t.access_token, expires: Date.now() + (t.expires_in ?? 86400) * 900 };
    return t.access_token;
  };
}

const devcycle = defineProvider({
  name: "DevCycle",
  hosts: ["api.devcycle.com", "auth.devcycle.com"],
  auth: {
    clientCredentials: secrets({
      label: "API credentials (client ID and secret)",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const token = await tokenSource(account.fields, fetch, signal)();
    const response = await fetch("https://api.devcycle.com/v1/projects?perPage=1", {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`DevCycle Management API returned ${response.status}.`);
    return { accountInfo: { externalId: account.fields.clientId, displayName: account.fields.clientId } };
  },
});

export default defineApp(
  { user: { accounts: { devcycle: devcycle.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.devcycle ?? [],
        (account) => {
          const token = tokenSource(account.fields, fetch, signal);
          const authed: Fetch = async (input, init) => {
            const request = new Request(input, init);
            if (new URL(request.url).host === "api.devcycle.com")
              request.headers.set("Authorization", `Bearer ${await token()}`);
            return fetch(request);
          };
          return withApprovals(
            liveOpenapiRouter({ ...options, cache, fetch: authed, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "DevCycle",
        description:
          "DevCycle feature flags: projects, features, variables, variations, environments, targeting, audiences, overrides and SDK keys.",
        icons,
      },
    ),
  }),
);
