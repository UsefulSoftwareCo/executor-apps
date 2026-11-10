import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  plain,
  raw,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { optionsFor } from "./openapi.js";

const TOKEN_URL = "https://id.vincere.io/oauth2/token";
const IdToken = object({ id_token: string({ minLength: 1 }) });
const TENANT = /^[a-zA-Z0-9-]+$/;

const tenantOf = (value: string) => {
  const tenant = value.trim().replace(/^https?:\/\//, "").replace(/\.vincere\.io.*$/, "");
  if (!TENANT.test(tenant)) throw new Error("Tenant must be the subdomain of your Vincere site, such as acme for acme.vincere.io.");
  return tenant;
};

const vincere = defineProvider({
  name: "Vincere",
  hosts: ["*.vincere.io"],
  auth: {
    // Vincere support issues the client ID and API key and registers the callback URL. The refresh token comes from
    // one run of the authorization code flow and stays valid for ten years, so Executor mints the one-hour id token.
    credentials: secrets({
      label: "Tenant, API key, client ID and refresh token",
      fields: object({
        tenant: plain(string({ minLength: 1 })),
        apiKey: string({ minLength: 1 }),
        clientId: plain(string({ minLength: 1 })),
        refreshToken: raw(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const tenant = tenantOf(account.fields.tenant);
    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      signal,
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({
        client_id: account.fields.clientId,
        grant_type: "refresh_token",
        refresh_token: account.fields.refreshToken,
      }).toString(),
    });
    const { id_token } = await decodeJson(tokenResponse, IdToken);
    const response = await fetch(`https://${tenant}.vincere.io/api/v2/user/me`, {
      signal,
      headers: { "id-token": id_token, "x-api-key": account.fields.apiKey, accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: tenant, displayName: `${tenant}.vincere.io` } };
  },
});

export default defineApp(
  { user: { accounts: { vincere: vincere.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vincere ?? [],
        (account) => {
          const sessions = cache.forAccount(account);
          // id tokens last one hour; renew from the refresh token a little early.
          const idToken = () =>
            sessions.get({
              key: ["idToken"],
              schema: string(),
              freshFor: "50 minutes",
              load: async ({ fetch: loadFetch, signal: loadSignal }) => {
                const response = await loadFetch(TOKEN_URL, {
                  method: "POST",
                  signal: loadSignal,
                  headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
                  body: new URLSearchParams({
                    client_id: account.fields.clientId,
                    grant_type: "refresh_token",
                    refresh_token: account.fields.refreshToken,
                  }).toString(),
                });
                return (await decodeJson(response, IdToken)).id_token;
              },
            });
          return withApprovals(
            liveOpenapiRouter({
              ...optionsFor(tenantOf(account.fields.tenant)),
              cache,
              signal,
              account,
              fetch: async (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("id-token", await idToken());
                const response = await fetch(input, { ...init, headers });
                if (response.status === 401) await sessions.invalidate(["idToken"]);
                return response;
              },
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Vincere",
        description:
          "Vincere recruitment CRM: candidates, contacts, companies, jobs, applications, placements, activities and documents.",
        icons,
      },
    ),
  }),
);
