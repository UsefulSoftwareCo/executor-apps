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
import { partnerOptions, provisioningOptions, quotingOptions, usageOptions, webhooksOptions } from "./openapi.js";

type Fetch = typeof fetch;
type ClientFields = { clientId: string; clientSecret: string };

const apiOrigin = "https://api.pax8.com";
const tokenUrl = `${apiOrigin}/v1/token`;

// Pax8 token requests take a JSON body whose audience picks the API family the token is valid for.
const partnerAudience = "https://api.pax8.com";
const provisioningAudience = "api://provisioning";
const usageAudience = "api://usage";

async function accessToken(fields: ClientFields, audience: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(tokenUrl, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      audience,
      client_id: fields.clientId,
      client_secret: fields.clientSecret,
    }),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Requests to the Pax8 API carry a token minted from the account's credentials; tokens last a day, so they are
// reused. `audienceFor` picks the audience from the request path (vendors have one per API).
function authorizedFetch(
  fields: ClientFields,
  audienceFor: (path: string) => string,
  fetcher: Fetch,
): Fetch {
  const cached = new Map<string, { token: string; expires: number }>();
  const token = async (audience: string, signal: AbortSignal | undefined) => {
    const hit = cached.get(audience);
    if (hit !== undefined && hit.expires > Date.now()) return hit.token;
    const t = await accessToken(fields, audience, fetcher, signal);
    cached.set(audience, { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 86400) - 120, 60) * 1000 });
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.origin !== apiOrigin || url.pathname === "/v1/token") return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(audienceFor(url.pathname), request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const partnerFetch = (fields: ClientFields, fetcher: Fetch) => authorizedFetch(fields, () => partnerAudience, fetcher);
const vendorFetch = (fields: ClientFields, fetcher: Fetch) =>
  authorizedFetch(fields, (path) => (path.startsWith("/v2/usage") ? usageAudience : provisioningAudience), fetcher);

const credentialFields = object({
  clientId: plain(string({ minLength: 1 })),
  clientSecret: string({ minLength: 1 }),
});

const pax8 = defineProvider({
  name: "Pax8",
  hosts: ["api.pax8.com"],
  auth: {
    // Partners request API keys in the Pax8 app; the keys cover every public partner API.
    partner: secrets({ label: "Partner API client ID and secret", fields: credentialFields }),
    // Marketplace vendors get a client ID and secret for the provisioning and usage APIs from their Pax8 contact.
    vendor: secrets({ label: "Vendor API client ID and secret", fields: credentialFields }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "vendor") {
      await accessToken(account.fields, provisioningAudience, fetch, signal);
      return { accountInfo: { externalId: account.fields.clientId, displayName: "Pax8 vendor" } };
    }
    const authed = partnerFetch(account.fields, fetch);
    const response = await authed(`${apiOrigin}/v1/companies?size=1`, { signal, headers: { Accept: "application/json" } });
    await decodeJson(response, json());
    return { accountInfo: { externalId: account.fields.clientId, displayName: "Pax8 partner" } };
  },
});

export default defineApp(
  { user: { accounts: { pax8: pax8.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pax8 ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          type Options = Omit<Parameters<typeof liveOpenapiRouter>[0], "cache" | "fetch" | "signal" | "account">;
          if (account.method === "vendor") {
            const authed = vendorFetch(account.fields, fetch);
            const mount = (options: Options) =>
              approve(liveOpenapiRouter({ ...options, cache, fetch: authed, signal, account }));
            return router(
              { provisioning: mount(provisioningOptions), usage: mount(usageOptions) },
              { title: "Pax8 vendor", description: "Pax8 vendor APIs: provisioning requests and usage lines." },
            );
          }
          const authed = partnerFetch(account.fields, fetch);
          const mount = (options: Options) =>
            approve(liveOpenapiRouter({ ...options, cache, fetch: authed, signal, account }));
          return router(
            { partner: mount(partnerOptions), quoting: mount(quotingOptions), webhooks: mount(webhooksOptions) },
            { title: "Pax8 partner", description: "Pax8 partner APIs: companies, products, orders, subscriptions, invoices, quotes and webhooks." },
          );
        },
        { signal },
      ),
      {
        title: "Pax8",
        description:
          "Pax8 cloud marketplace. Partner accounts: partner (companies, contacts, products, pricing, orders, subscriptions, invoices, usage summaries), quoting (quotes, line items, attachments) and webhooks. Vendor accounts: provisioning and usage.",
        icons,
      },
    ),
  }),
);
