import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
  oauth2,
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
import { options, origin } from "./openapi.js";

const tokenUrl = "https://connect.reapit.cloud/token";
const apiVersion = "2020-01-31";

type Fetch = typeof fetch;
type ClientFields = { clientId: string; clientSecret: string; customerId: string };

async function accessToken(fields: ClientFields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(tokenUrl, {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
      Authorization: `Basic ${btoa(`${fields.clientId}:${fields.clientSecret}`)}`,
    },
    body: new URLSearchParams({ client_id: fields.clientId, grant_type: "client_credentials" }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Wraps fetch so every platform request carries the api-version header, plus (for client credentials) a token
// minted from the app's credentials and the reapit-customer header. Other requests pass through untouched.
function platformFetch(fields: ClientFields | undefined, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (fields === undefined) return undefined;
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 120, 60) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("api-version", apiVersion);
    const minted = await token(request.signal);
    if (minted !== undefined && fields !== undefined) {
      request.headers.set("Authorization", `Bearer ${minted}`);
      request.headers.set("reapit-customer", fields.customerId);
    }
    return fetcher(request);
  }) as Fetch;
}

const reapit = defineProvider({
  name: "Reapit",
  hosts: ["platform.reapit.cloud", "connect.reapit.cloud"],
  auth: {
    // Machine-to-machine: the client credentials grant of a Reapit Foundations app.
    clientCredentials: secrets({
      label: "Client ID, client secret and customer ID (SBOX for the sandbox)",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
        customerId: plain(string({ minLength: 1 })),
      }),
    }),
    // Authorization code flow through Reapit Connect; the token is bound to the signed-in customer.
    // This provider is marked disable_pkce; the framework has no switch for it, so PKCE parameters are
    // left to the framework. Resource scopes are set per app in the Developer Portal.
    oauth: oauth2({
      authorizationUrl: "https://connect.reapit.cloud/authorize",
      tokenUrl,
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["openid", "offline_access"],
    }),
  },
  async health({ account, fetch, signal }) {
    const fields = account.method === "clientCredentials" ? account.fields : undefined;
    const headers: Record<string, string> = { accept: "application/json" };
    if (account.method === "oauth") headers.Authorization = `Bearer ${account.fields.access_token}`;
    const response = await platformFetch(fields, fetch)(`${origin}/offices?pageSize=1`, { signal, headers });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { reapit: reapit.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.reapit ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({
              ...options,
              cache,
              fetch: platformFetch(account.method === "clientCredentials" ? account.fields : undefined, fetch),
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Reapit",
        description:
          "Reapit Foundations for estate agents: properties, contacts, applicants, vendors, landlords, tenancies, appointments, offers, enquiries, tasks, works orders, offices, negotiators and the rest of the Platform API.",
        instructions:
          "Which calls succeed depends on the scopes granted to the Reapit app; others return HTTP 403. PATCH operations require the resource's current eTag in the If-Match header (returned by GET).",
        icons,
      },
    ),
  }),
);
