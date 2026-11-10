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
const regions = ["us", "eu", "au", "ca", "uk", "jp", "sg", "in"];

type ClientFields = {
  host: string;
  tenantId: string;
  workspaceId: string;
  clientId: string;
  clientSecret: string;
  authMethod?: string;
  scopes?: string;
};

// A Cloudentity tenant is served from <tenant>.<region>.authz.cloudentity.io (the region label may be absent on
// older tenants). Credentials only ever go to that origin.
function originOf(raw: string): string {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error("Enter your tenant host, for example acme.us.authz.cloudentity.io.");
  }
  if (url.protocol !== "https:") throw new Error("The Cloudentity tenant must be reached over https.");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "")
    throw new Error("Enter only the tenant host, with no path.");
  if (!url.hostname.endsWith(".authz.cloudentity.io"))
    throw new Error("Enter the tenant host on authz.cloudentity.io, for example acme.us.authz.cloudentity.io.");
  return url.origin;
}

async function accessToken(origin: string, fields: ClientFields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const tenant = encodeURIComponent(fields.tenantId.trim());
  const workspace = encodeURIComponent(fields.workspaceId.trim());
  // The OAuth default (and Cloudentity's) token endpoint auth method is client_secret_basic; clients configured
  // for client_secret_post set authMethod to "post".
  const post = fields.authMethod?.trim().toLowerCase() === "post";
  const params = new URLSearchParams({ grant_type: "client_credentials" });
  const scopes = fields.scopes?.trim();
  if (scopes) params.set("scope", scopes);
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" };
  if (post) {
    params.set("client_id", fields.clientId);
    params.set("client_secret", fields.clientSecret);
  } else {
    const basic = `${encodeURIComponent(fields.clientId)}:${encodeURIComponent(fields.clientSecret)}`;
    headers.Authorization = `Basic ${btoa(basic)}`;
  }
  const response = await fetcher(`${origin}/${tenant}/${workspace}/oauth2/token`, {
    method: "POST",
    signal,
    headers,
    body: params.toString(),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
}

// Wraps fetch so requests to the tenant carry a bearer token minted from the client's credentials; other
// requests (such as fetching the Swagger document) pass through untouched.
function authorizedFetch(origin: string, fields: ClientFields, fetcher: Fetch): Fetch {
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
    if (target.origin !== origin || target.pathname.endsWith("/oauth2/token")) return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const cloudentity = defineProvider({
  name: "Cloudentity",
  // <tenant>.<region>.authz.cloudentity.io. A host wildcard covers only one leading label, so each region needs
  // its own entry (the region list is not published in a machine-readable form; extend it for new regions).
  hosts: [...regions.map((r) => `*.${r}.authz.cloudentity.io`), "*.authz.cloudentity.io"],
  auth: {
    // An application in the Admin workspace with the client_credentials grant (Applications > Clients).
    clientCredentials: secrets({
      label: "Client credentials",
      fields: object({
        host: plain(string({ minLength: 1 })),
        tenantId: plain(string({ minLength: 1 })),
        workspaceId: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
        // "basic" (default, client_secret_basic) or "post" (client_secret_post).
        authMethod: plain(string()).optional(),
        // Space-separated scopes to request; omit to take the client's granted scopes.
        scopes: plain(string()).optional(),
      }),
    }),
    // An Admin API access token minted elsewhere.
    token: secrets({
      label: "Admin API access token",
      fields: object({
        host: plain(string({ minLength: 1 })),
        tenantId: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.host);
    const tenant = encodeURIComponent(account.fields.tenantId.trim());
    const authed =
      account.method === "clientCredentials" ? authorizedFetch(origin, account.fields, fetch) : fetch;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (account.method === "token") headers.Authorization = `Bearer ${account.fields.token}`;
    const response = await authed(`${origin}/api/admin/${tenant}/servers`, { signal, headers });
    // 403 means the token is valid but lacks the scope to list workspaces.
    if (response.status !== 403) await decodeJson(response, json());
    const host = new URL(origin).host;
    return {
      accountInfo: {
        externalId: account.method === "clientCredentials" ? `${host}:${account.fields.clientId}` : host,
        displayName: host,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { cloudentity: cloudentity.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cloudentity ?? [],
        (account) => {
          const origin = originOf(account.fields.host);
          const tenant = encodeURIComponent(account.fields.tenantId.trim());
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: `${origin}/api/admin/${tenant}`,
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
        title: "Cloudentity",
        description:
          "Cloudentity (SecureAuth Connect) Admin API: workspaces, clients, identity pools and providers, scopes, policies, consents, MFA methods, gateways and more.",
        instructions:
          "Most operations are scoped to a workspace (authorization server) via the wid path parameter. What a call may do depends on the scopes granted to the client.",
        icons,
      },
    ),
  }),
);
