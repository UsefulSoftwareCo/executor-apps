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
import { apis, origin } from "./openapi.js";

type Fetch = typeof fetch;
type Fields = { clientId: string; clientSecret: string };

const serviceName = "Walmart Marketplace";

// POST /v3/token takes the client ID and secret as Basic credentials with a client-credentials form body, plus
// Walmart's service-name and correlation-id headers. Tokens last 15 minutes.
async function accessToken(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/v3/token`, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Basic ${btoa(`${fields.clientId}:${fields.clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "WM_SVC.NAME": serviceName,
      "WM_QOS.CORRELATION_ID": crypto.randomUUID(),
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Requests to the Marketplace origin carry the minted token as WM_SEC.ACCESS_TOKEN, plus the service name and a
// correlation id when the operation did not set them. Other requests (such as fetching the OpenAPI documents)
// pass through untouched.
function authorizedFetch(fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 900) - 60, 30) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("WM_SEC.ACCESS_TOKEN", await token(request.signal));
    if (!request.headers.has("WM_SVC.NAME")) request.headers.set("WM_SVC.NAME", serviceName);
    if (!request.headers.has("WM_QOS.CORRELATION_ID")) request.headers.set("WM_QOS.CORRELATION_ID", crypto.randomUUID());
    if (!request.headers.has("Accept")) request.headers.set("Accept", "application/json");
    return fetcher(request);
  }) as Fetch;
}

const walmart = defineProvider({
  name: "Walmart Marketplace",
  hosts: ["marketplace.walmartapis.com"],
  auth: {
    // Seller Center > Settings > API Key Management: a Client ID and Client Secret for the Marketplace APIs.
    clientCredentials: secrets({
      label: "Client ID and secret",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  // A token is only issued for valid credentials.
  async health({ account, fetch, signal }) {
    await accessToken(account.fields, fetch, signal);
    return { accountInfo: { externalId: account.fields.clientId, displayName: account.fields.clientId } };
  },
});

export default defineApp(
  { user: { accounts: { walmart: walmart.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.walmart ?? [],
        (account) => {
          const authed = authorizedFetch(account.fields, fetch);
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch: authed, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            Object.fromEntries(Object.entries(apis).map(([key, options]) => [key, mount(options)])) as {
              [K in keyof typeof apis]: ReturnType<typeof mount>;
            },
            { title: "Walmart Marketplace", description: "Walmart Marketplace seller account." },
          );
        },
        { signal },
      ),
      {
        title: "Walmart Marketplace",
        description:
          "Walmart Marketplace seller APIs. items: catalog items and item setup. inventory, prices, promotions. orders, returns, fulfillment (WFS), shipWithWalmart, simplifiedShipping. feeds and reports: bulk uploads and on-request reports. settings, notifications, lagTime, utilities. insights, assortmentRecommendations, recommendations, reviews. disputes, claims, payments, paymentReports.",
        icons,
      },
    ),
  }),
);
