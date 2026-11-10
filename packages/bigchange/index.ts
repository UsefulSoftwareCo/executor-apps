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
import { assetsOptions, restOptions, webhooksOptions } from "./openapi.js";

type Fetch = typeof fetch;
type Fields = { customerId: string; clientId: string; clientSecret: string };

const origin = "https://api.bigchange.com";

function customerIdOf(fields: Fields): string {
  const id = fields.customerId.trim();
  if (!/^[0-9]+$/.test(id)) throw new Error("The BigChange customer id is a number, for example 5690.");
  return id;
}

// BigChange's authentication proxy: an OAuth 2.0 client-credentials grant with the id and secret in the form body.
async function accessToken(fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/auth/tokens`, {
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

// Requests to the API carry the minted bearer token and the account's Customer-Id header (which replaces any
// value passed as a tool argument). The published swagger documents and the token endpoint pass through untouched.
function authorizedFetch(fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 60, 30) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    const target = new URL(request.url);
    if (target.origin !== origin || target.pathname === "/auth/tokens" || target.pathname.startsWith("/swagger/"))
      return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    request.headers.set("Customer-Id", customerIdOf(fields));
    return fetcher(request);
  }) as Fetch;
}

const bigchange = defineProvider({
  name: "BigChange",
  hosts: ["api.bigchange.com"],
  auth: {
    // A Partner API application from the BigChange developer portal (Account > Manage API Keys / Integrations).
    clientCredentials: secrets({
      label: "API application",
      fields: object({
        customerId: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const customerId = customerIdOf(account.fields);
    const authed = authorizedFetch(account.fields, fetch);
    const response = await authed(`${origin}/v1/customers/${customerId}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, json());
    return {
      accountInfo: { externalId: customerId, displayName: `BigChange customer ${customerId}` },
    };
  },
});

export default defineApp(
  { user: { accounts: { bigchange: bigchange.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.bigchange ?? [],
        (account) => {
          const authed = authorizedFetch(account.fields, fetch);
          const mount = (options: Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch: authed, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              rest: mount(restOptions),
              assets: mount(assetsOptions),
              webhooks: mount(webhooksOptions),
            },
            { title: "BigChange", description: "BigChange account." },
          );
        },
        { signal },
      ),
      {
        title: "BigChange",
        description:
          "BigChange field service and job management. rest: jobs, job groups, contacts, persons, resources, vehicles, finance (invoices, quotes, purchase orders, sales opportunities), stock, notes, worksheets, timesheets, reference data. assets: assets, categories, attributes, services and service agreements. webhooks: subscriptions and failed messages.",
        instructions:
          "Every operation lists a Customer-Id header argument; the connected account's customer id is always sent in its place, so any numeric value will do. List endpoints paginate with pageNumber and pageSize.",
        icons,
      },
    ),
  }),
);
