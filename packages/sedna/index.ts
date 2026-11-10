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

type Fetch = typeof fetch;
type Fields = { tenant: string; clientId: string; clientSecret: string };

// The tenant is the first label of <tenant>.sednanetwork.com. Credentials only ever go to that origin, and the
// provider's `hosts` limit them to sednanetwork.com as well.
function originOf(raw: string): string {
  const tenant = raw.trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(tenant))
    throw new Error("Enter your Sedna tenant name, the first part of <tenant>.sednanetwork.com.");
  return `https://${tenant}.sednanetwork.com`;
}

async function accessToken(origin: string, fields: Fields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/platform/oauth/token`, {
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

// Requests to the tenant carry a JWT minted from the API credential (valid one hour); other requests pass through.
function authorizedFetch(origin: string, fields: Fields, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const t = await accessToken(origin, fields, fetcher, signal);
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 120, 60) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    const target = new URL(request.url);
    if (target.origin !== origin || target.pathname === "/platform/oauth/token") return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const credentialFields = object({
  tenant: plain(string({ minLength: 1 })),
  clientId: plain(string({ minLength: 1 })),
  clientSecret: string({ minLength: 1 }),
});

const sedna = defineProvider({
  name: "Sedna",
  hosts: ["*.sednanetwork.com"],
  auth: {
    // Recommended by Sedna: API Credentials from Settings > API Credential Management, exchanged for a token.
    clientCredentials: secrets({ label: "API credentials (OAuth 2.0 client credentials)", fields: credentialFields }),
    // The same API Credentials sent as HTTP Basic username and password.
    basic: secrets({ label: "API credentials (Basic auth)", fields: credentialFields }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.tenant);
    const authed =
      account.method === "clientCredentials" ? authorizedFetch(origin, account.fields, fetch) : fetch;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (account.method === "basic")
      headers.Authorization = `Basic ${btoa(`${account.fields.clientId}:${account.fields.clientSecret}`)}`;
    const response = await authed(`${origin}/platform/2019-01-01/company/me`, { signal, headers });
    await decodeJson(response, object({}));
    const tenant = new URL(origin).hostname.split(".")[0]!;
    return { accountInfo: { externalId: `${tenant}:${account.fields.clientId}`, displayName: tenant } };
  },
});

export default defineApp(
  { user: { accounts: { sedna: sedna.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sedna ?? [],
        (account) => {
          const origin = originOf(account.fields.tenant);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/platform`,
              cache,
              fetch: account.method === "clientCredentials" ? authorizedFetch(origin, account.fields, fetch) : fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Sedna",
        description:
          "Sedna maritime email and workflow platform: messages, drafts, contacts, teams, category tags, job references, documents, templates, workflows and more.",
        instructions:
          "What a call may do depends on the API permissions granted to the API credential in Sedna (for example MESSAGE_READ).",
        icons,
      },
    ),
  }),
);
