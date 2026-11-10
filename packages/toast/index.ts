import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
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
import { specs } from "./openapi.js";

type Fetch = typeof fetch;
type Fields = { subdomain: string; clientId: string; clientSecret: string };

// Toast serves each environment from its own subdomain of toasttab.com (ws-api for production, ws-sandbox-api for
// the sandbox). Credentials only ever go to https://<subdomain>.toasttab.com.
function originOf(raw: string): string {
  const subdomain = raw.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(subdomain))
    throw new Error("Enter only the API subdomain, for example ws-api or ws-sandbox-api.");
  return `https://${subdomain}.toasttab.com`;
}

async function login(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/authentication/v1/authentication/login`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      clientId: fields.clientId,
      clientSecret: fields.clientSecret,
      userAccessType: "TOAST_MACHINE_CLIENT",
    }),
  });
  const { token } = await decodeJson(response, object({ token: object({ accessToken: string() }) }));
  return token.accessToken;
}

// Wraps fetch so requests to the account's own origin carry a bearer token from Toast's login endpoint. Tokens
// last 24 hours; this one is reused for 12. Other requests (such as fetching the OpenAPI documents) pass through.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const accessToken = await login(origin, fields, fetcher, signal);
    cached = { token: accessToken, expires: Date.now() + 12 * 60 * 60 * 1000 };
    return accessToken;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const toast = defineProvider({
  name: "Toast",
  auth: {
    // Credentials issued by Toast for an API integration (Toast Web > Integrations > Toast API access, or the
    // Toast integrations team). The subdomain is part of the account, so the provider declares no static `hosts`.
    clientCredentials: secrets({
      label: "API client credentials",
      fields: object({
        subdomain: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  // The login itself validates the credentials; no restaurant is needed.
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.subdomain);
    await login(origin, account.fields, fetch, signal);
    return { accountInfo: { externalId: `${origin}:${account.fields.clientId}`, displayName: new URL(origin).host } };
  },
});

export default defineApp(
  { user: { accounts: { toast: toast.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.toast ?? [],
        (account) => {
          const origin = originOf(account.fields.subdomain);
          const authed = authorizedFetch(origin, account.fields, fetch);
          const mount = (key: keyof typeof specs) =>
            withApprovals(
              liveOpenapiRouter({
                ...specs[key].options,
                allowedOrigin: origin,
                baseUrl: `${origin}${specs[key].basePath}`,
                cache,
                fetch: authed,
                signal,
                account,
              }),
              (tool) => (tool.kind === "mutation" ? always() : undefined),
            );
          return router(
            {
              orders: mount("orders"),
              menus: mount("menus"),
              labor: mount("labor"),
              restaurants: mount("restaurants"),
              cashManagement: mount("cashManagement"),
              partners: mount("partners"),
              stock: mount("stock"),
            },
            { title: "Toast", description: "Toast restaurant POS APIs." },
          );
        },
        { signal },
      ),
      {
        title: "Toast",
        description:
          "Toast restaurant POS: orders and checks, menus, employees, shifts and time entries, cash management, restaurant configuration and partner access, stock and inventory.",
        instructions:
          "Almost every operation takes a Toast-Restaurant-External-ID header: the GUID of the restaurant location, which must be one the API client has been granted. What a call may do depends on the scopes on the API client.",
        icons,
      },
    ),
  }),
);
