import {
  accountRouter,
  array,
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

// An Ory Network project lives at https://<slug>.projects.oryapis.com (or on a custom domain); credentials only
// ever go to that origin.
function originOf(raw: string): string {
  const text = raw.trim().toLowerCase();
  const slug = text.replace(/^https?:\/\//, "").replace(/\.projects\.oryapis\.com.*$/, "");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug))
    throw new Error("Enter your Ory project slug, for example happy-fermi-abc123.");
  return `https://${slug}.projects.oryapis.com`;
}

type Credentials = { projectSlug: string; clientId: string; clientSecret: string };

function authorizedFetch(origin: string, fields: Credentials, fetcher: Fetch): Fetch {
  let cached: { token: string; expires: number } | undefined;
  const token = async (signal: AbortSignal | undefined) => {
    if (cached !== undefined && cached.expires > Date.now()) return cached.token;
    const response = await fetcher(`${origin}/oauth2/token`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: fields.clientId,
        client_secret: fields.clientSecret,
      }).toString(),
    });
    const t = await decodeJson(response, object({ access_token: string(), expires_in: number().optional() }));
    cached = { token: t.access_token, expires: Date.now() + Math.max((t.expires_in ?? 3600) - 60, 30) * 1000 };
    return t.access_token;
  };
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    // Swap the minted token in where the operation asks for the account (openapi.ts fills the scheme with the
    // client secret); public operations go without it.
    if (new URL(request.url).origin !== origin || request.headers.get("Authorization") !== `Bearer ${fields.clientSecret}`)
      return fetcher(request);
    request.headers.set("Authorization", `Bearer ${await token(request.signal)}`);
    return fetcher(request);
  }) as Fetch;
}

const ory = defineProvider({
  name: "Ory",
  // One level of subdomain, so the slug can vary per account; the router further restricts credentials to the
  // account's own project origin.
  hosts: ["*.projects.oryapis.com"],
  auth: {
    apiKey: secrets({
      label: "Project API key",
      fields: object({
        projectSlug: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
    }),
    clientCredentials: secrets({
      label: "OAuth2 client credentials",
      fields: object({
        projectSlug: plain(string({ minLength: 1 })),
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const origin = originOf(account.fields.projectSlug);
    if (account.method === "clientCredentials") {
      // Admin endpoints need a project API key, so a client-credentials account is healthy once a token is minted.
      const token = await fetch(`${origin}/oauth2/token`, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: account.fields.clientId,
          client_secret: account.fields.clientSecret,
        }).toString(),
      });
      await decodeJson(token, object({ access_token: string() }));
      return { accountInfo: { externalId: new URL(origin).hostname, displayName: new URL(origin).hostname } };
    }
    const response = await fetch(`${origin}/admin/identities?page_size=1`, {
      signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, array(object({})));
    return { accountInfo: { externalId: new URL(origin).hostname, displayName: new URL(origin).hostname } };
  },
});

export default defineApp(
  { user: { accounts: { ory: ory.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ory ?? [],
        (account) => {
          const origin = originOf(account.fields.projectSlug);
          return withApprovals(
            liveOpenapiRouter({
              ...options,
              allowedOrigin: origin,
              baseUrl: origin,
              cache,
              fetch:
                account.method === "clientCredentials"
                  ? authorizedFetch(origin, account.fields as Credentials, fetch)
                  : fetch,
              signal,
              account,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Ory",
        description:
          "Ory Network identity and access management: identities, sessions, recovery, OAuth2 and OpenID Connect clients, tokens, permission relationships and project configuration.",
        icons,
      },
    ),
  }),
);
