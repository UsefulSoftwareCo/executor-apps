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
import { options, productionOrigin, sandboxOrigin } from "./openapi.js";

type Fetch = typeof fetch;
type Fields = { environment: string; clientId: string; secret: string };

function originOf(environment: string): string {
  const value = environment.trim().toLowerCase();
  if (value === "production") return productionOrigin;
  if (value === "sandbox") return sandboxOrigin;
  throw new Error('Environment must be "production" or "sandbox".');
}

async function mintToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/Authorization`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ClientId: fields.clientId, Secret: fields.secret }),
  });
  return decodeJson(response, object({ Token: string() }));
}

// Aspire exchanges the Client ID and secret for a bearer token. Requests to the account's origin carry a token
// minted on first use and again after a 401; other requests (such as the OpenAPI document) pass through untouched.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: string | undefined;
  const token = async (signal: AbortSignal | undefined, fresh: boolean) => {
    if (cached === undefined || fresh) cached = (await mintToken(origin, fields, fetcher, signal)).Token;
    return cached;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    const retry = request.clone();
    request.headers.set("Authorization", `Bearer ${await token(request.signal, false)}`);
    const response = await fetcher(request);
    if (response.status !== 401) return response;
    retry.headers.set("Authorization", `Bearer ${await token(retry.signal, true)}`);
    return fetcher(retry);
  }) as Fetch;
}

const aspire = defineProvider({
  name: "Aspire",
  hosts: ["cloud-api.youraspire.com", "cloudsandbox-api.youraspire.com"],
  auth: {
    apiCredentials: secrets({
      label: "API Client ID and secret",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        secret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.environment);
    const authed = authorizedFetch(origin, account.fields, fetch);
    const response = await authed(`${origin}/Version/GetApiVersion`, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Aspire rejected the credentials (status ${response.status}).`);
  },
});

export default defineApp(
  { user: { accounts: { aspire: aspire.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.aspire ?? [],
        (account) => {
          const origin = originOf(account.fields.environment);
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
        title: "Aspire",
        description:
          "Aspire landscaping and field-service ERP: properties, contacts, opportunities, work tickets, invoices, payments, catalog items, equipment, vendors, receipts and time clock.",
        instructions:
          "List tools take OData options ($filter, $select, $orderby, $expand, $top, $skip). Many resources are read-only; which calls succeed depends on the API user's permissions in Aspire.",
        icons,
      },
    ),
  }),
);
