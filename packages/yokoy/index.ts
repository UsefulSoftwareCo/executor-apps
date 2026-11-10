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
type ClientFields = { environment: string; organizationId: string; clientId: string; clientSecret: string };

// Yokoy runs a production environment (yokoy.ai) and a test environment (test.yokoy.ai). Each has its own
// accounts host (token endpoint) and api host.
function hostsOf(raw: string): { accounts: string; api: string } {
  const env = raw.trim().toLowerCase();
  if (env !== "yokoy.ai" && env !== "test.yokoy.ai")
    throw new Error("The Yokoy environment must be yokoy.ai or test.yokoy.ai.");
  return { accounts: `https://accounts.${env}`, api: `https://api.${env}` };
}

function baseOf(fields: ClientFields): { origin: string; baseUrl: string; tokenUrl: string } {
  const { accounts, api } = hostsOf(fields.environment);
  const org = fields.organizationId.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(org)) throw new Error("Enter the Yokoy organization ID, for example AbcDeF1234.");
  return { origin: api, baseUrl: `${api}/v1/organizations/${org}`, tokenUrl: `${accounts}/oauth2/token` };
}

async function accessToken(tokenUrl: string, fields: ClientFields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(tokenUrl, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${btoa(`${fields.clientId}:${fields.clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Wraps fetch so requests to the account's API origin carry a token minted from the client credentials.
function authorizedFetch(fields: ClientFields, fetcher: Fetch): Fetch {
  const { origin, tokenUrl } = baseOf(fields);
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(tokenUrl, fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3900) - 120, 60) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    if (new URL(request.url).origin !== origin) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const yokoy = defineProvider({
  name: "Yokoy",
  hosts: ["accounts.yokoy.ai", "api.yokoy.ai", "accounts.test.yokoy.ai", "api.test.yokoy.ai"],
  auth: {
    // An API client created in Yokoy (Settings > API clients) gives a client ID and secret. Yokoy uses no scopes.
    clientCredentials: secrets({
      label: "API client credentials",
      fields: object({
        environment: plain(string({ minLength: 1 })),
        organizationId: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const { baseUrl } = baseOf(account.fields);
    const authed = authorizedFetch(account.fields, fetch);
    const response = await authed(`${baseUrl}/legal-entities`, { signal, headers: { Accept: "application/json" } });
    await decodeJson(response, json());
    return {
      accountInfo: {
        externalId: `${account.fields.environment}:${account.fields.organizationId}`,
        displayName: `${account.fields.organizationId} (${account.fields.environment})`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { yokoy: yokoy.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.yokoy ?? [],
        (account) => {
          const { origin, baseUrl } = baseOf(account.fields);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl,
              cache,
              fetch: authorizedFetch(account.fields, fetch),
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Yokoy",
        description:
          "Expenses, invoices, legal entities, card accounts, categories, cost centers, users, FX rates and the rest of the Yokoy spend management API for one organization.",
        instructions:
          "Every call is scoped to the connected organization. List endpoints take filter and pagination parameters described in the operation inputs.",
        icons,
      },
    ),
  }),
);
