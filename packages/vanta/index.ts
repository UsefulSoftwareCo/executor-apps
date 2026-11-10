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
type ClientFields = { clientId: string; clientSecret: string; scope: string };

const origin = "https://api.vanta.com";

async function accessToken(fields: ClientFields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const response = await fetcher(`${origin}/oauth/token`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: fields.clientId,
      client_secret: fields.clientSecret,
      scope: fields.scope,
      grant_type: "client_credentials",
    }),
  });
  return decodeJson(response, object({ access_token: string(), expires_in: number() }));
}

// Vanta keeps one active token per application and revokes it when a new one is minted, so every consumer in
// this process (tool calls and health checks) shares one cached token per application.
const tokens = new Map<string, { token: string; expires: number }>();
const tokenKey = (fields: ClientFields) => `${fields.clientId}\n${fields.scope}`;

async function cachedToken(fields: ClientFields, fetcher: Fetch, signal: AbortSignal | undefined) {
  const key = tokenKey(fields);
  const cached = tokens.get(key);
  if (cached !== undefined && cached.expires > Date.now()) return cached.token;
  const t = await accessToken(fields, fetcher, signal);
  tokens.set(key, { token: t.access_token, expires: Date.now() + Math.max(t.expires_in - 120, 60) * 1000 });
  return t.access_token;
}

// Wraps fetch so requests to api.vanta.com carry a bearer token minted from the application's client
// credentials (tokens last one hour); other requests, such as fetching the OpenAPI document, pass through.
// A 401 drops the cached token (another consumer may have revoked it), mints a new one and retries once.
function authorizedFetch(fields: ClientFields, fetcher: Fetch): Fetch {
  return (async (input: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const request = new Request(input, init);
    const target = new URL(request.url);
    if (target.origin !== origin || target.pathname === "/oauth/token") return fetcher(request);
    const retry = request.clone();
    request.headers.set("Authorization", `Bearer ${await cachedToken(fields, fetcher, request.signal)}`);
    const response = await fetcher(request);
    if (response.status !== 401) return response;
    tokens.delete(tokenKey(fields));
    retry.headers.set("Authorization", `Bearer ${await cachedToken(fields, fetcher, retry.signal)}`);
    return fetcher(retry);
  }) as Fetch;
}

const vanta = defineProvider({
  name: "Vanta",
  hosts: ["api.vanta.com"],
  auth: {
    // A Manage Vanta application from the Vanta Developer Console. Vanta supports only client credentials for it.
    clientCredentials: secrets({
      label: "Manage Vanta application",
      fields: object({
        clientId: plain(string({ minLength: 1 })),
        clientSecret: string({ minLength: 1 }),
        // Space-separated, for example "vanta-api.all:read vanta-api.all:write". Must be granted to the application.
        scope: plain(string({ minLength: 1 })),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    // Reads one page of frameworks with the shared cached token, so it neither revokes the tool-call token
    // nor skips the scope check.
    const response = await authorizedFetch(account.fields, fetch)(`${origin}/v1/frameworks?pageSize=1`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, object({ results: json() }));
    return { accountInfo: { externalId: account.fields.clientId, displayName: account.fields.clientId } };
  },
});

export default defineApp(
  { user: { accounts: { vanta: vanta.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vanta ?? [],
        (account) =>
          withApprovals(
            liveOpenapiRouter({ ...options, cache, fetch: authorizedFetch(account.fields, fetch), signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Vanta",
        description:
          "Controls, tests, documents, vendors, people, risk scenarios, vulnerabilities, policies and resources in a Vanta compliance tenant.",
        instructions:
          "What a call may do depends on the scopes granted to the Manage Vanta application. List endpoints paginate with pageSize and pageCursor; pass the previous endCursor as pageCursor.",
        icons,
      },
    ),
  }),
);
